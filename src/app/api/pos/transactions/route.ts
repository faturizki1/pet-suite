import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  transactions,
  transactionItems,
  products,
  stockMutations,
} from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { CreateTransactionSchema } from "@/lib/validations/pos";
import { eq, sql } from "drizzle-orm";

function generateNoTransaksi(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `INV-${dateStr}-${random}`;
}

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

    // Atomic transaction
    const result = await db.transaction(async (tx) => {
      // 1. Validate all products: is_active=true, stok >= qty
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
      }> = [];

      for (const item of items) {
        if (item.tipe_item === "produk") {
          if (!item.product_id) {
            throw new Error("VALIDATION: product_id wajib untuk tipe produk");
          }

          const product = await tx.query.products.findFirst({
            where: eq(products.id, item.product_id),
          });

          if (!product || !product.isActive) {
            throw new Error(
              `VALIDATION: Produk tidak ditemukan atau tidak aktif`
            );
          }

          if (product.stok! < item.qty) {
            throw new Error(
              `STOCK: Stok ${product.nama} tidak mencukupi (tersedia: ${product.stok})`
            );
          }

          const itemSubtotal =
            Number(product.hargaJual) * item.qty - item.diskon;
          subtotal += itemSubtotal;

          itemSnapshots.push({
            tipeItem: "produk",
            productId: item.product_id,
            serviceId: null,
            namaItem: product.nama,
            hargaSatuan: product.hargaJual,
            qty: item.qty,
            diskonItem: item.diskon.toString(),
            subtotal: itemSubtotal.toString(),
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
              `VALIDATION: Layanan tidak ditemukan atau tidak aktif`
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
          });
        }
      }

      // 2. Calculate total
      const total = subtotal - diskon_nominal;

      // 3. If tunai, validate uang_diterima >= total
      let kembalian = 0;
      if (metode_bayar === "tunai") {
        if (!uang_diterima || uang_diterima < total) {
          throw new Error(
            "VALIDATION: Uang diterima kurang dari total"
          );
        }
        kembalian = uang_diterima - total;
      }

      // 4. Generate no_transaksi
      const noTransaksi = generateNoTransaksi();

      // 5. Insert transaction
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

      // 6. Insert transaction_items
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

      // 7. Update stock for each product (with row lock)
      for (const item of items) {
        if (item.tipe_item === "produk" && item.product_id) {
          // Row lock: SELECT ... FOR UPDATE
          const [locked] = await tx.execute(
            sql`SELECT stok FROM products WHERE id = ${item.product_id}::uuid FOR UPDATE`
          );

          const currentStok = Number((locked as { stok: number }).stok);
          const newStok = currentStok - item.qty;

          if (newStok < 0) {
            throw new Error(
              `STOCK: Stok tidak mencukupi setelah row lock`
            );
          }

          await tx
            .update(products)
            .set({ stok: newStok })
            .where(eq(products.id, item.product_id));

          // Insert stock mutation
          await tx.insert(stockMutations).values({
            productId: item.product_id,
            tipe: "keluar",
            qtySebelum: currentStok,
            qtyPerubahan: -item.qty,
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