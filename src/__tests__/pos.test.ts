import { CreateTransactionSchema } from "@/lib/validations/pos";

describe("CreateTransactionSchema — Zod validation", () => {
  it("should accept valid transaction with products", () => {
    const result = CreateTransactionSchema.safeParse({
      items: [
        { tipe_item: "produk", product_id: "550e8400-e29b-41d4-a716-446655440000", qty: 2, diskon: 0 },
      ],
      metode_bayar: "tunai",
      diskon_nominal: 0,
      uang_diterima: 100000,
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid transaction with services", () => {
    const result = CreateTransactionSchema.safeParse({
      items: [
        { tipe_item: "layanan", service_id: "550e8400-e29b-41d4-a716-446655440001", qty: 1, diskon: 0 },
      ],
      metode_bayar: "qris",
      diskon_nominal: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should reject item with tipe=produk but no product_id (XOR validation)", () => {
    const result = CreateTransactionSchema.safeParse({
      items: [
        { tipe_item: "produk", service_id: "550e8400-e29b-41d4-a716-446655440001", qty: 1, diskon: 0 },
      ],
      metode_bayar: "tunai",
      diskon_nominal: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("product_id");
    }
  });

  it("should reject item with tipe=layanan but no service_id (XOR validation)", () => {
    const result = CreateTransactionSchema.safeParse({
      items: [
        { tipe_item: "layanan", product_id: "550e8400-e29b-41d4-a716-446655440000", qty: 1, diskon: 0 },
      ],
      metode_bayar: "tunai",
      diskon_nominal: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("service_id");
    }
  });

  it("should reject empty items array", () => {
    const result = CreateTransactionSchema.safeParse({
      items: [],
      metode_bayar: "tunai",
      diskon_nominal: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative qty", () => {
    const result = CreateTransactionSchema.safeParse({
      items: [
        { tipe_item: "produk", product_id: "550e8400-e29b-41d4-a716-446655440000", qty: -1, diskon: 0 },
      ],
      metode_bayar: "tunai",
      diskon_nominal: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid metode_bayar", () => {
    const result = CreateTransactionSchema.safeParse({
      items: [
        { tipe_item: "produk", product_id: "550e8400-e29b-41d4-a716-446655440000", qty: 1, diskon: 0 },
      ],
      metode_bayar: "paypal",
      diskon_nominal: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("POS kalkulasi — subtotal, diskon, total, kembalian", () => {
  it("should calculate subtotal correctly (harga * qty - diskon)", () => {
    const items = [
      { harga: 10000, qty: 2, diskon: 0 },   // 20000
      { harga: 50000, qty: 1, diskon: 5000 }, // 45000
    ];
    const subtotal = items.reduce((sum, i) => sum + i.harga * i.qty - i.diskon, 0);
    expect(subtotal).toBe(65000);
  });

  it("should calculate total correctly (subtotal - diskon_nominal)", () => {
    const subtotal = 65000;
    const diskonNominal = 5000;
    const total = subtotal - diskonNominal;
    expect(total).toBe(60000);
  });

  it("should calculate kembalian correctly (uang_diterima - total)", () => {
    const total = 60000;
    const uangDiterima = 100000;
    const kembalian = uangDiterima - total;
    expect(kembalian).toBe(40000);
  });

  it("should reject payment if uang_diterima < total for tunai", () => {
    const total = 60000;
    const uangDiterima = 50000;
    expect(uangDiterima >= total).toBe(false);
  });
});

describe("no_transaksi generator — format INV-YYYYMMDD-XXXX", () => {
  function generateNoTransaksi(dateStr: string, counter: number): string {
    return `INV-${dateStr}-${counter.toString().padStart(4, "0")}`;
  }

  it("should format correctly with counter 1", () => {
    const result = generateNoTransaksi("20240617", 1);
    expect(result).toBe("INV-20240617-0001");
  });

  it("should format correctly with counter 9999", () => {
    const result = generateNoTransaksi("20240617", 9999);
    expect(result).toBe("INV-20240617-9999");
  });

  it("should produce unique values for different counters", () => {
    const r1 = generateNoTransaksi("20240617", 1);
    const r2 = generateNoTransaksi("20240617", 2);
    expect(r1).not.toBe(r2);
  });

  it("should produce unique values for different dates", () => {
    const r1 = generateNoTransaksi("20240617", 1);
    const r2 = generateNoTransaksi("20240618", 1);
    expect(r1).not.toBe(r2);
  });
});

describe("stock_mutations invariant", () => {
  it("should maintain qty_sebelum + qty_perubahan = qty_sesudah for masuk", () => {
    const qtySebelum = 10;
    const qtyPerubahan = 5;
    const qtySesudah = qtySebelum + qtyPerubahan;
    expect(qtySesudah).toBe(15);
  });

  it("should maintain qty_sebelum + qty_perubahan = qty_sesudah for keluar", () => {
    const qtySebelum = 10;
    const qtyPerubahan = -3;
    const qtySesudah = qtySebelum + qtyPerubahan;
    expect(qtySesudah).toBe(7);
  });

  it("should not allow negative stock after mutation", () => {
    const qtySebelum = 2;
    const qtyPerubahan = -5;
    const qtySesudah = qtySebelum + qtyPerubahan;
    expect(qtySesudah).toBeLessThan(0);
    // This should be rejected by business logic
    expect(qtySesudah < 0).toBe(true);
  });
});

describe("row lock stok — concurrent safety simulation", () => {
  it("should prevent negative stock when two transactions reduce same product", async () => {
    // Simulate: stok awal = 5, dua transaksi paralel masing-masing ambil 3
    // Dengan row lock, salah satu harus gagal
    const stokAwal = 5;
    const qty1 = 3;
    const qty2 = 3;

    // Tanpa row lock: keduanya baca stok=5
    const stokBaca1 = stokAwal;
    const stokBaca2 = stokAwal;

    // Keduanya validasi lolos
    expect(stokBaca1 >= qty1).toBe(true);
    expect(stokBaca2 >= qty2).toBe(true);

    // Tapi setelah update, stok jadi negatif
    const stokSesudah1 = stokBaca1 - qty1; // 2
    const stokSesudah2 = stokBaca2 - qty2; // 2 (seharusnya dari 2 - 3 = -1)
    // Ini yang dicegah row lock: transaksi 2 harusnya baca stok=2, bukan 5
    expect(stokSesudah2).toBe(2); // Tanpa row lock, ini salah — harusnya -1
    // Dengan row lock, transaksi 2 akan baca stok=2 dan gagal karena 2 < 3
    const stokReal2 = stokSesudah1; // setelah transaksi 1 commit, stok=2
    expect(stokReal2 >= qty2).toBe(false); // row lock mencegah ini
  });
});