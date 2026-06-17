import { z } from "zod";

export const CreateProductSchema = z.object({
  kode_produk: z.string().min(1),
  category_id: z.string().uuid().optional(),
  nama: z.string().min(1).max(200),
  deskripsi: z.string().optional(),
  harga_beli: z.number().min(0).default(0),
  harga_jual: z.number().positive(),
  stok: z.number().int().min(0).default(0),
  stok_minimum: z.number().int().min(0).default(5),
  satuan: z.string().default("pcs"),
});

export const StockMutationSchema = z.object({
  tipe: z.enum(["masuk", "adjustment"]),
  qty: z.number().int().positive(),
  catatan: z.string().optional(),
});