import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  transactions,
  transactionItems,
  products,
  services,
  stockMutations,
  dailyCounters,
} from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { CreateTransactionSchema } from "@/lib/validations/pos";
import { eq, sql, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token tidak valid" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20"),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0");

    const result = await db.query.transactions.findMany({
      with: {
        kasir: {
          columns: { id: true, namaLengkap: true },
        },
        customer: {
          columns: { id: true, namaLengkap: true },
        },
        items: true,
      },
      limit,
      offset,
      orderBy: (transactions, { desc }) => [desc(transactions.tglTransaksi)],
    });

    // Customer only sees their own transactions
    const filtered =
      payload.role === "customer"
        ? result.filter((t) => t.customerId === payload.sub)
        : result;

    return NextResponse.json({ data: filtered });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token tidak valid" },
        { status: 401 }
      );
    }

    // Only staff and owner can create transactions
    if (payload.role !== "staff" && payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Sensitive endpoint — re-check is_active
    await assertActiveUser(payload.sub);

    const body = await request.json();
    const parsed = CreateTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const { items, metode_bayar, diskon_nominal, uang_diterima, catatan, customer_id } =
      parsed.data;

    // Atomic transaction — semua dalam SATU db.transaction()
    const result = await db.transaction(async (tx) => {
      // ============================================================
      // FASE 1: Row lock stok + validasi (SEBELUM insert apapun)
      // ============================================================
      let subtotal = 0;
      const itemSnapshots: Array<{
        tipeItem: string;
        productId: string | null;
        serviceId: string | null;
        namaItem: string;
        hargaSatuan: string;
        qty: number;
        diskonItem: string;
        subtotal: string;
        // Stok saat row lock di FASE 1 — dipakai ulang di FASE 5 agar tidak lock dua kali
        lockedStok: number | null;
      }> = [];

      for (const item of items) {
        if (item.tipe_item === "produk") {
          if (!item.product_id) {
            throw new Error("VALIDATION: product_id wajib untuk tipe produk");
          }

          // Row lock stok SEBELUM validasi apapun
          const [locked] = await tx.execute(
            sql`SELECT id, nama, harga_jual, stok, is_active FROM products WHERE id = ${item.product_id}::uuid FOR UPDATE`
          );

          if (!locked) {
            throw new Error("VALIDATION: Produk tidak ditemukan");
          }

          const product = locked as {
            id: string;
            nama: string;
            harga_jual: string;
            stok: number;
            is_active: boolean;
          };

          if (!product.is_active) {
            throw new Error("VALIDATION: Produk tidak aktif");
          }

          if (product.stok < item.qty) {
            throw new Error(
              `STOCK: Stok ${product.nama} tidak mencukupi (tersedia: ${product.stok})`
            );
          }

          const itemSubtotal =
            Number(product.harga_jual) * item.qty - item.diskon;
          subtotal += itemSubtotal;

          itemSnapshots.push({
            tipeItem: "produk",
            productId: item.product_id,
            serviceId: null,
            namaItem: product.nama,
            hargaSatuan: product.harga_jual,
            qty: item.qty,
            diskonItem: item.diskon.toString(),
            subtotal: itemSubtotal.toString(),
            // Simpan stok hasil row lock FASE 1 untuk dipakai di FASE 5
            lockedStok: product.stok,
          });
        } else if (item.tipe_item === "layanan") {
          if (!item.service_id) {
            throw new Error(
              "VALIDATION: service_id wajib untuk tipe layanan"
            );
          }

          const service = await tx.query.services.findFirst({
            where: eq(services.id, item.service_id),
          });

          if (!service || !service.isActive) {
            throw new Error(
              "VALIDATION: Layanan tidak ditemukan atau tidak aktif"
            );
          }

          const itemSubtotal =
            Number(service.harga) * item.qty - item.diskon;
          subtotal += itemSubtotal;

          itemSnapshots.push({
            tipeItem: "layanan",
            productId: null,
            serviceId: item.service_id,
            namaItem: service.nama,
            hargaSatuan: service.harga,
            qty: item.qty,
            diskonItem: item.diskon.toString(),
            subtotal: itemSubtotal.toString(),
            lockedStok: null,
          });
        }
      }

      // ============================================================
      // FASE 2: Generate no_transaksi via row lock counter
      // ============================================================
      const today = new Date().toISOString().slice(0, 10);
      const dateStr = today.replace(/-/g, "");

      // Row lock pada daily counter untuk hari ini
      let [counterRow] = await tx.execute(
        sql`SELECT id, counter FROM daily_counters WHERE tanggal = ${today}::date FOR UPDATE`
      );

      let nextCounter: number;
      let counterId: string;

      if (counterRow) {
        const row = counterRow as { id: string; counter: number };
        nextCounter = row.counter + 1;
        counterId = row.id;
        await tx
          .update(dailyCounters)
          .set({ counter: nextCounter })
          .where(eq(dailyCounters.id, counterId));
      } else {
        // Race condition: dua request paralel bisa sama-sama masuk cabang ini.
        // INSERT ... ON CONFLICT DO NOTHING memastikan hanya satu yang berhasil insert.
        // Yang gagal karena unique constraint akan SELECT FOR UPDATE ulang
        // untuk mengambil row yang sudah dibuat request lain.
        nextCounter = 1;
        try {
          const [newRow] = await tx
            .insert(dailyCounters)
            .values({ tanggal: today, counter: 1 })
            .onConflictDoNothing()
            .returning();

          if (newRow) {
            // Insert berhasil (kita yang pertama)
            counterId = newRow.id;
          } else {
            // Insert gagal karena row sudah ada dari request lain.
            // SELECT FOR UPDATE ulang untuk ambil row yang sudah ada.
            const [existingRow] = await tx.execute(
              sql`SELECT id, counter FROM daily_counters WHERE tanggal = ${today}::date FOR UPDATE`
            );
            const existing = existingRow as { id: string; counter: number };
            nextCounter = existing.counter + 1;
            counterId = existing.id;
            await tx
              .update(dailyCounters)
              .set({ counter: nextCounter })
              .where(eq(dailyCounters.id, counterId));
          }
        } catch {
          // Fallback: jika ada error lain, coba SELECT FOR UPDATE ulang
          const [existingRow] = await tx.execute(
            sql`SELECT id, counter FROM daily_counters WHERE tanggal = ${today}::date FOR UPDATE`
          );
          const existing = existingRow as { id: string; counter: number };
          nextCounter = existing.counter + 1;
          counterId = existing.id;
          await tx
            .update(dailyCounters)
            .set({ counter: nextCounter })
            .where(eq(dailyCounters.id, counterId));
        }
      }

      const noTransaksi = `INV-${dateStr}-${nextCounter.toString().padStart(4, "0")}`;

      // ============================================================
      // FASE 3: Hitung total + validasi pembayaran
      // ============================================================
      const total = subtotal - diskon_nominal;

      let kembalian = 0;
      if (metode_bayar === "tunai") {
        if (!uang_diterima || uang_diterima < total) {
          throw new Error("VALIDATION: Uang diterima kurang dari total");
        }
        kembalian = uang_diterima - total;
      }

      // ============================================================
      // FASE 4: Insert transaction + items
      // ============================================================
      const [transaction] = await tx
        .insert(transactions)
        .values({
          noTransaksi,
          customerId: customer_id || null,
          kasirId: payload.sub,
          subtotal: subtotal.toString(),
          diskonNominal: diskon_nominal.toString(),
          total: total.toString(),
          metodeBayar: metode_bayar,
          uangDiterima: uang_diterima?.toString(),
          kembalian: kembalian.toString(),
          catatan: catatan || null,
          status: "lunas",
        })
        .returning();

      for (const snapshot of itemSnapshots) {
        await tx.insert(transactionItems).values({
          transactionId: transaction.id,
          tipeItem: snapshot.tipeItem,
          productId: snapshot.productId,
          serviceId: snapshot.serviceId,
          namaItem: snapshot.namaItem,
          hargaSatuan: snapshot.hargaSatuan,
          qty: snapshot.qty,
          diskonItem: snapshot.diskonItem,
          subtotal: snapshot.subtotal,
        });
      }

      // ============================================================
      // FASE 5: Update stok (stok sudah di-row-lock di FASE 1)
      // ============================================================
      for (const snapshot of itemSnapshots) {
        if (snapshot.tipeItem === "produk" && snapshot.productId && snapshot.lockedStok !== null) {
          // Pakai hasil lock dari FASE 1 — tidak perlu row lock lagi
          const currentStok = snapshot.lockedStok;
          const newStok = currentStok - snapshot.qty;

          if (newStok < 0) {
            throw new Error("STOCK: Stok tidak mencukupi setelah row lock");
          }

          await tx
            .update(products)
            .set({ stok: newStok })
            .where(eq(products.id, snapshot.productId));

          await tx.insert(stockMutations).values({
            productId: snapshot.productId,
            tipe: "keluar",
            qtySebelum: currentStok,
            qtyPerubahan: -snapshot.qty,
            qtySesudah: newStok,
            referensi: noTransaksi,
            staffId: payload.sub,
          });
        }
      }

      return transaction;
    });

    return NextResponse.json(
      {
        data: result,
        message: "Transaksi berhasil",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED_INACTIVE") {
        return NextResponse.json(
          { error: "Akun tidak aktif" },
          { status: 403 }
        );
      }
      if (error.message.startsWith("VALIDATION:")) {
        return NextResponse.json(
          { error: error.message.replace("VALIDATION: ", "") },
          { status: 400 }
        );
      }
      if (error.message.startsWith("STOCK:")) {
        return NextResponse.json(
          { error: error.message.replace("STOCK: ", "") },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}