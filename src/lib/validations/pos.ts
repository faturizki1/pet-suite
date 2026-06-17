import { z } from "zod";

const TransactionItemSchema = z
  .object({
    tipe_item: z.enum(["produk", "layanan"]),
    product_id: z.string().uuid().optional(),
    service_id: z.string().uuid().optional(),
    qty: z.number().int().positive(),
    diskon: z.number().min(0).default(0),
  })
  .refine(
    (data) => {
      if (data.tipe_item === "produk") return !!data.product_id;
      if (data.tipe_item === "layanan") return !!data.service_id;
      return false;
    },
    {
      message:
        "product_id wajib untuk tipe produk, service_id wajib untuk tipe layanan",
    }
  );

export const CreateTransactionSchema = z.object({
  customer_id: z.string().uuid().optional(),
  items: z.array(TransactionItemSchema).min(1),
  metode_bayar: z.enum(["tunai", "transfer", "qris", "debit"]),
  diskon_nominal: z.number().min(0).default(0),
  uang_diterima: z.number().optional(),
  catatan: z.string().optional(),
});
