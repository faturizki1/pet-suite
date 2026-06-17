import { z } from "zod";

export const CreateBookingSchema = z
  .object({
    slot_id: z.string().uuid(),
    customer_id: z.string().uuid().optional(),
    nama_guest: z.string().optional(),
    no_hp_guest: z.string().optional(),
    nama_hewan: z.string().min(1),
    spesies: z.string().min(1),
    keluhan: z.string().optional(),
  })
  .refine(
    (data) => data.customer_id || (data.nama_guest && data.no_hp_guest),
    { message: "customer_id atau nama_guest + no_hp_guest wajib diisi" }
  );