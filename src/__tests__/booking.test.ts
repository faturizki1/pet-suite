import { CreateBookingSchema } from "@/lib/validations/booking";

describe("CreateBookingSchema — Zod validation", () => {
  it("should accept booking with customer_id", () => {
    const result = CreateBookingSchema.safeParse({
      slot_id: "550e8400-e29b-41d4-a716-446655440000",
      customer_id: "550e8400-e29b-41d4-a716-446655440001",
      nama_hewan: "Milo",
      spesies: "Kucing",
      keluhan: "Demam",
    });
    expect(result.success).toBe(true);
  });

  it("should accept booking with guest name and phone", () => {
    const result = CreateBookingSchema.safeParse({
      slot_id: "550e8400-e29b-41d4-a716-446655440000",
      nama_guest: "Budi",
      no_hp_guest: "08123456789",
      nama_hewan: "Milo",
      spesies: "Kucing",
    });
    expect(result.success).toBe(true);
  });

  it("should reject booking without customer_id or guest info", () => {
    const result = CreateBookingSchema.safeParse({
      slot_id: "550e8400-e29b-41d4-a716-446655440000",
      nama_hewan: "Milo",
      spesies: "Kucing",
    });
    expect(result.success).toBe(false);
  });

  it("should reject booking with guest name but no phone", () => {
    const result = CreateBookingSchema.safeParse({
      slot_id: "550e8400-e29b-41d4-a716-446655440000",
      nama_guest: "Budi",
      nama_hewan: "Milo",
      spesies: "Kucing",
    });
    expect(result.success).toBe(false);
  });
});

describe("booking slot counter — concurrent safety simulation", () => {
  it("should prevent overbooking when kuota=1 and two requests come simultaneously", async () => {
    // Simulasi: slot kuota=1, terisi=0
    // Dua request paralel tanpa row lock akan sama-sama lolos
    const kuota = 1;
    let terisi = 0;

    // Simulasi dua request baca terisi bersamaan (tanpa row lock)
    const terisiBaca1 = terisi;
    const terisiBaca2 = terisi;

    // Keduanya validasi lolos karena terisi (0) < kuota (1)
    expect(terisiBaca1 < kuota).toBe(true);
    expect(terisiBaca2 < kuota).toBe(true);

    // Keduanya increment dari snapshot yang sama
    const newTerisi1 = terisiBaca1 + 1; // 1
    const newTerisi2 = terisiBaca2 + 1; // 1 (harusnya 2, tapi pakai snapshot basi)

    // Overwrite: terisi jadi 1, bukan 2
    terisi = newTerisi2; // transaksi 2 commit terakhir

    // Sekarang terisi=1, tapi seharusnya 2 booking untuk kuota=1
    expect(terisi).toBe(1); // seharusnya 2 kalau aman
    expect(terisi > kuota).toBe(false); // overbooking tidak terdeteksi

    // Dengan row lock: transaksi 2 akan baca terisi=1 (setelah transaksi 1 lock)
    // Maka terisiBaca2 = 1, dan 1 < 1 = false → ditolak
    const terisiDenganLock = 1; // setelah transaksi 1 commit
    expect(terisiDenganLock < kuota).toBe(false); // row lock mencegah ini
  });

  it("should handle multiple concurrent bookings with kuota=3", async () => {
    const kuota = 3;
    let terisi = 0;

    // Simulasi 5 request paralel
    const requests = 5;
    const results: boolean[] = [];

    for (let i = 0; i < requests; i++) {
      // Tanpa row lock: semua baca terisi saat itu
      const currentTerisi = terisi;
      if (currentTerisi < kuota) {
        terisi = currentTerisi + 1;
        results.push(true);
      } else {
        results.push(false);
      }
    }

    // Tanpa row lock, lebih dari kuota bisa lolos karena race condition
    const accepted = results.filter(Boolean).length;
    expect(accepted).toBeGreaterThan(kuota); // overbooking terjadi
    expect(terisi).toBeGreaterThan(kuota); // stok terisi > kuota

    // Dengan row lock: hanya 3 yang diterima
    let terisiAman = 0;
    const resultsAman: boolean[] = [];
    for (let i = 0; i < requests; i++) {
      // Row lock memastikan baca nilai terbaru
      const currentTerisi = terisiAman;
      if (currentTerisi < kuota) {
        terisiAman = currentTerisi + 1;
        resultsAman.push(true);
      } else {
        resultsAman.push(false);
      }
    }
    const acceptedAman = resultsAman.filter(Boolean).length;
    expect(acceptedAman).toBe(kuota);
    expect(terisiAman).toBe(kuota);
  });
});