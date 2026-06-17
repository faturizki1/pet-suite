import { z } from "zod";

export const CreateTransactionSchema = z.object({
  customer_id: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        tipe_item: z.enum(["produk", "layanan"]),
        product_id: z.string().uuid().optional(),
        service_id: z.string().uuid().optional(),
        qty: z.number().int().positive(),
        diskon: z.number().min(0).default(0),
      })
    )
    .min(1),
  metode_bayar: z.enum(["tunai", "transfer", "qris", "debit"]),
  diskon_nominal: z.number().min(0).default(0),
  uang_diterima: z.number().optional(),
  catatan: z.string().optional(),
});