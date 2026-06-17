import { z } from "zod";

export const CreateExpenseSchema = z.object({
  kategori: z.string().min(1),
  deskripsi: z.string().min(1),
  jumlah: z.number().positive(),
  tgl_pengeluaran: z.string(),
});