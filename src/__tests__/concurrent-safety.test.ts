import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/db/client";
import { sql, eq } from "drizzle-orm";
import {
  bookingSlots,
  onlineBookings,
  products,
  categories,
  profiles,
  dailyCounters,
} from "@/db/schema";
import { createSessionToken } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { NextRequest } from "next/server";

/**
 * Integration tests for concurrent safety (race condition prevention).
 *
 * These tests run against a REAL PostgreSQL database (test instance).
 * They use db.transaction() with FOR UPDATE row locks to verify
 * that concurrent requests are properly serialized.
 *
 * Prerequisites:
 *   docker compose -f docker-compose.test.yml up -d
 *   npm run test
 */

describe("booking slot counter — concurrent safety (real DB)", () => {
  let slotId: string;

  beforeAll(async () => {
    // Create a slot with kuota=1, terisi=0
    const [slot] = await db
      .insert(bookingSlots)
      .values({
        tanggal: "2099-12-31",
        jamMulai: "09:00",
        jamSelesai: "10:00",
        kuota: 1,
        terisi: 0,
        isAvailable: true,
      })
      .returning();
    slotId = slot.id;
  });

  afterAll(async () => {
    // Clean up
    await db.delete(onlineBookings);
    await db.delete(bookingSlots);
  });

  it("should allow only 1 booking when kuota=1 and 2 parallel requests race", async () => {
    // Two parallel transactions, each trying to book the same slot
    const results = await Promise.allSettled([
      // Transaction 1
      db.transaction(async (tx1) => {
        const [locked] = await tx1.execute(
          sql`SELECT id, kuota, terisi, is_available FROM booking_slots WHERE id = ${slotId}::uuid FOR UPDATE`
        );
        const slot = locked as {
          id: string;
          kuota: number;
          terisi: number;
          is_available: boolean;
        };
        if (!slot.is_available || slot.terisi >= slot.kuota) {
          throw new Error("SLOT_FULL");
        }
        const newTerisi = slot.terisi + 1;
        await tx1
          .update(bookingSlots)
          .set({ terisi: newTerisi, isAvailable: newTerisi < slot.kuota })
          .where(eq(bookingSlots.id, slot.id));
        const [booking] = await tx1
          .insert(onlineBookings)
          .values({
            slotId: slot.id,
            namaHewan: "Kucing-A",
            spesies: "Kucing",
            keluhan: "Test parallel booking 1",
          })
          .returning();
        return booking;
      }),
      // Transaction 2
      db.transaction(async (tx2) => {
        const [locked] = await tx2.execute(
          sql`SELECT id, kuota, terisi, is_available FROM booking_slots WHERE id = ${slotId}::uuid FOR UPDATE`
        );
        const slot = locked as {
          id: string;
          kuota: number;
          terisi: number;
          is_available: boolean;
        };
        if (!slot.is_available || slot.terisi >= slot.kuota) {
          throw new Error("SLOT_FULL");
        }
        const newTerisi = slot.terisi + 1;
        await tx2
          .update(bookingSlots)
          .set({ terisi: newTerisi, isAvailable: newTerisi < slot.kuota })
          .where(eq(bookingSlots.id, slot.id));
        const [booking] = await tx2
          .insert(onlineBookings)
          .values({
            slotId: slot.id,
            namaHewan: "Kucing-B",
            spesies: "Kucing",
            keluhan: "Test parallel booking 2",
          })
          .returning();
        return booking;
      }),
    ]);

    // One must succeed, one must fail with SLOT_FULL
    const successes = results.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const failures = results.filter(
      (r) => r.status === "rejected"
    ).length;

    expect(successes).toBe(1);
    expect(failures).toBe(1);

    // The rejected one should be SLOT_FULL
    const rejected = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    expect(rejected!.reason?.message).toBe("SLOT_FULL");

    // Verify final state: terisi should be 1, not 2
    const [finalSlot] = await db
      .select({ terisi: bookingSlots.terisi, isAvailable: bookingSlots.isAvailable })
      .from(bookingSlots)
      .where(eq(bookingSlots.id, slotId));
    expect(finalSlot.terisi).toBe(1);
    expect(finalSlot.isAvailable).toBe(false);

    // Verify only 1 booking record exists
    const bookings = await db
      .select()
      .from(onlineBookings)
      .where(eq(onlineBookings.slotId, slotId));
    expect(bookings.length).toBe(1);
  });
});

// ============================================================
// FASE 2 — Real tests that call the actual POST handler
// ============================================================
describe("FASE 2 — Booking security: customer_id dari token vs body (real handler)", () => {
  let slotId: string;
  let customerProfileId: string;
  let otherCustomerId: string;
  let customerToken: string;

  beforeAll(async () => {
    // Create a slot with enough kuota
    const [slot] = await db
      .insert(bookingSlots)
      .values({
        tanggal: "2099-12-30",
        jamMulai: "10:00",
        jamSelesai: "11:00",
        kuota: 10,
        terisi: 0,
        isAvailable: true,
      })
      .returning();
    slotId = slot.id;

    // Create a customer profile for the token
    const pwHash = await hashPassword("test123");
    const [customer] = await db
      .insert(profiles)
      .values({
        email: `customer-test-${Date.now()}@test.com`,
        passwordHash: pwHash,
        role: "customer",
        namaLengkap: "Test Customer",
        isActive: true,
      })
      .returning();
    customerProfileId = customer.id;

    // Create another customer (to test that body customer_id is ignored)
    const [otherCustomer] = await db
      .insert(profiles)
      .values({
        email: `other-customer-${Date.now()}@test.com`,
        passwordHash: pwHash,
        role: "customer",
        namaLengkap: "Other Customer",
        isActive: true,
      })
      .returning();
    otherCustomerId = otherCustomer.id;

    // Create a valid session token for the first customer
    customerToken = await createSessionToken({
      sub: customerProfileId,
      role: "customer",
      is_active: true,
    });
  });

  afterAll(async () => {
    await db.delete(onlineBookings);
    await db.delete(bookingSlots);
    await db.delete(profiles).where(eq(profiles.id, customerProfileId));
    await db.delete(profiles).where(eq(profiles.id, otherCustomerId));
  });

  it("should use customer_id from token, not from body, when valid session exists", async () => {
    // Import the actual POST handler
    const { POST } = await import("@/app/api/booking/route");

    // Build a NextRequest with a valid customer cookie but body says otherCustomerId
    const url = new URL("http://localhost:3000/api/booking");
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: slotId,
        customer_id: otherCustomerId, // body tries to impersonate other customer
        nama_hewan: "Milo",
        spesies: "Kucing",
        keluhan: "Test token override",
      }),
    });

    // Manually set the cookie on the request
    // NextRequest cookies can be set via the cookie header
    Object.defineProperty(req, "cookies", {
      value: {
        get: (name: string) => {
          if (name === "vetcare_session") return { value: customerToken };
          return undefined;
        },
        has: () => true,
        [Symbol.iterator]: function* () {
          yield { name: "vetcare_session", value: customerToken };
        },
      },
      writable: false,
    });

    const res = await POST(req);
    const json = await res.json();

    // Response should be 201 (success)
    expect(res.status).toBe(201);

    // Verify in database: the stored customer_id should be from token, not body
    const booking = await db.query.onlineBookings.findFirst({
      where: eq(onlineBookings.slotId, slotId),
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });

    expect(booking).not.toBeNull();
    expect(booking!.customerId).toBe(customerProfileId);
    expect(booking!.customerId).not.toBe(otherCustomerId);
  });

  it("should reject guest booking that provides customer_id in body", async () => {
    const { POST } = await import("@/app/api/booking/route");

    const url = new URL("http://localhost:3000/api/booking");
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: slotId,
        customer_id: otherCustomerId, // guest tries to set customer_id
        nama_hewan: "Bobby",
        spesies: "Anjing",
        keluhan: "Test guest reject",
      }),
    });

    // No cookie set — guest request
    Object.defineProperty(req, "cookies", {
      value: {
        get: () => undefined,
        has: () => false,
        [Symbol.iterator]: function* () {},
      },
      writable: false,
    });

    const res = await POST(req);
    const json = await res.json();

    // Response should be 403
    expect(res.status).toBe(403);
    expect(json.error).toContain("Guest");

    // Verify NO booking was created
    const bookings = await db
      .select()
      .from(onlineBookings)
      .where(eq(onlineBookings.namaHewan, "Bobby"));
    expect(bookings.length).toBe(0);
  });

  it("should allow guest booking with nama_guest and no_hp_guest (no customer_id)", async () => {
    const { POST } = await import("@/app/api/booking/route");

    const url = new URL("http://localhost:3000/api/booking");
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: slotId,
        nama_guest: "Budi",
        no_hp_guest: "08123456789",
        nama_hewan: "Charlie",
        spesies: "Kelinci",
        keluhan: "Test guest allowed",
      }),
    });

    // No cookie set — guest request
    Object.defineProperty(req, "cookies", {
      value: {
        get: () => undefined,
        has: () => false,
        [Symbol.iterator]: function* () {},
      },
      writable: false,
    });

    const res = await POST(req);
    const json = await res.json();

    // Response should be 201
    expect(res.status).toBe(201);

    // Verify in database: customer_id is NULL, nama_guest and no_hp_guest are set
    const booking = await db.query.onlineBookings.findFirst({
      where: eq(onlineBookings.namaHewan, "Charlie"),
    });

    expect(booking).not.toBeNull();
    expect(booking!.customerId).toBeNull();
    expect(booking!.namaGuest).toBe("Budi");
    expect(booking!.noHpGuest).toBe("08123456789");
  });
});

describe("FASE 3 — daily_counters race condition: parallel insert counter baru", () => {
  it("should handle two parallel counter inserts at start of day — both succeed with different numbers", async () => {
    // Gunakan tanggal unik untuk test ini supaya tidak bentrok dengan test lain
    const testDate = "2099-12-29";
    const testDateStr = "20991229";

    // Hapus counter untuk tanggal test jika ada
    await db.delete(dailyCounters).where(eq(dailyCounters.tanggal, testDate));

    // Dua transaksi paralel, keduanya masuk cabang "else" (counter belum ada)
    const results = await Promise.allSettled([
      db.transaction(async (tx1) => {
        // Coba SELECT FOR UPDATE — tidak ada row
        const [row] = await tx1.execute(
          sql`SELECT id, counter FROM daily_counters WHERE tanggal = ${testDate}::date FOR UPDATE`
        );
        if (!row) {
          // Insert dengan ON CONFLICT DO NOTHING
          const [newRow] = await tx1
            .insert(dailyCounters)
            .values({ tanggal: testDate, counter: 1 })
            .onConflictDoNothing()
            .returning();
          if (newRow) {
            return { noTransaksi: `INV-${testDateStr}-0001`, counter: 1 };
          } else {
            // Row sudah dibuat request lain, SELECT FOR UPDATE ulang
            const [existing] = await tx1.execute(
              sql`SELECT id, counter FROM daily_counters WHERE tanggal = ${testDate}::date FOR UPDATE`
            );
            const e = existing as { id: string; counter: number };
            const nextCounter = e.counter + 1;
            await tx1
              .update(dailyCounters)
              .set({ counter: nextCounter })
              .where(eq(dailyCounters.id, e.id));
            return { noTransaksi: `INV-${testDateStr}-${String(nextCounter).padStart(4, "0")}`, counter: nextCounter };
          }
        } else {
          const r = row as { id: string; counter: number };
          const nextCounter = r.counter + 1;
          await tx1
            .update(dailyCounters)
            .set({ counter: nextCounter })
            .where(eq(dailyCounters.id, r.id));
          return { noTransaksi: `INV-${testDateStr}-${String(nextCounter).padStart(4, "0")}`, counter: nextCounter };
        }
      }),
      db.transaction(async (tx2) => {
        const [row] = await tx2.execute(
          sql`SELECT id, counter FROM daily_counters WHERE tanggal = ${testDate}::date FOR UPDATE`
        );
        if (!row) {
          const [newRow] = await tx2
            .insert(dailyCounters)
            .values({ tanggal: testDate, counter: 1 })
            .onConflictDoNothing()
            .returning();
          if (newRow) {
            return { noTransaksi: `INV-${testDateStr}-0001`, counter: 1 };
          } else {
            const [existing] = await tx2.execute(
              sql`SELECT id, counter FROM daily_counters WHERE tanggal = ${testDate}::date FOR UPDATE`
            );
            const e = existing as { id: string; counter: number };
            const nextCounter = e.counter + 1;
            await tx2
              .update(dailyCounters)
              .set({ counter: nextCounter })
              .where(eq(dailyCounters.id, e.id));
            return { noTransaksi: `INV-${testDateStr}-${String(nextCounter).padStart(4, "0")}`, counter: nextCounter };
          }
        } else {
          const r = row as { id: string; counter: number };
          const nextCounter = r.counter + 1;
          await tx2
            .update(dailyCounters)
            .set({ counter: nextCounter })
            .where(eq(dailyCounters.id, r.id));
          return { noTransaksi: `INV-${testDateStr}-${String(nextCounter).padStart(4, "0")}`, counter: nextCounter };
        }
      }),
    ]);

    // Keduanya harus sukses
    const successes = results.filter((r) => r.status === "fulfilled");
    const failures = results.filter((r) => r.status === "rejected");
    expect(successes.length).toBe(2);
    expect(failures.length).toBe(0);

    // Keduanya harus punya nomor berbeda
    interface CounterResult { counter: number; noTransaksi: string }
    const result1 = (successes[0] as PromiseFulfilledResult<CounterResult>).value;
    const result2 = (successes[1] as PromiseFulfilledResult<CounterResult>).value;
    expect(result1.counter).not.toBe(result2.counter);
    expect(result1.noTransaksi).not.toBe(result2.noTransaksi);

    // Counter final harus 2
    const [finalCounter] = await db
      .select({ counter: dailyCounters.counter })
      .from(dailyCounters)
      .where(eq(dailyCounters.tanggal, testDate));
    expect(finalCounter.counter).toBe(2);

    // Cleanup
    await db.delete(dailyCounters).where(eq(dailyCounters.tanggal, testDate));
  });
});

describe("POS stock — concurrent safety (real DB)", () => {
  let productId: string;
  let categoryId: string;

  beforeAll(async () => {
    // Create a category first
    const [cat] = await db
      .insert(categories)
      .values({ nama: "Test Category", tipe: "produk" })
      .returning();
    categoryId = cat.id;

    // Create a product with stok=5
    const [product] = await db
      .insert(products)
      .values({
        categoryId: cat.id,
        kodeProduk: `TEST-${Date.now()}`,
        nama: "Produk Test Race Condition",
        hargaJual: "10000",
        stok: 5,
        isActive: true,
      })
      .returning();
    productId = product.id;
  });

  afterAll(async () => {
    // Clean up
    await db.delete(products).where(eq(products.id, productId));
    await db.delete(categories).where(eq(categories.id, categoryId));
  });

  it("should prevent negative stock when 2 parallel transactions reduce same product (stok=5, each takes 3)", async () => {
    // Two parallel transactions, each trying to take 3 from stok=5
    const results = await Promise.allSettled([
      // Transaction 1: try to take 3
      db.transaction(async (tx1) => {
        const [locked] = await tx1.execute(
          sql`SELECT id, stok FROM products WHERE id = ${productId}::uuid FOR UPDATE`
        );
        const product = locked as { id: string; stok: number };
        if (product.stok < 3) {
          throw new Error(`STOCK: Stok tidak mencukupi (tersedia: ${product.stok})`);
        }
        const newStok = product.stok - 3;
        await tx1
          .update(products)
          .set({ stok: newStok })
          .where(eq(products.id, product.id));
        return newStok;
      }),
      // Transaction 2: try to take 3
      db.transaction(async (tx2) => {
        const [locked] = await tx2.execute(
          sql`SELECT id, stok FROM products WHERE id = ${productId}::uuid FOR UPDATE`
        );
        const product = locked as { id: string; stok: number };
        if (product.stok < 3) {
          throw new Error(`STOCK: Stok tidak mencukupi (tersedia: ${product.stok})`);
        }
        const newStok = product.stok - 3;
        await tx2
          .update(products)
          .set({ stok: newStok })
          .where(eq(products.id, product.id));
        return newStok;
      }),
    ]);

    // One must succeed, one must fail with stock error
    const successes = results.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const failures = results.filter(
      (r) => r.status === "rejected"
    ).length;

    expect(successes).toBe(1);
    expect(failures).toBe(1);

    // The rejected one should be a stock error
    const rejected = results.find(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    expect(rejected!.reason?.message).toContain("STOCK:");

    // Verify final stock: 5 - 3 = 2 (not negative)
    const [finalProduct] = await db
      .select({ stok: products.stok })
      .from(products)
      .where(eq(products.id, productId));
    expect(finalProduct.stok).toBe(2);
    expect(finalProduct.stok).toBeGreaterThanOrEqual(0);
  });
});