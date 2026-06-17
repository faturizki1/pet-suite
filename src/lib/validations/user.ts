import { z } from "zod";

export const UpdateUserSchema = z.object({
  nama_lengkap: z.string().min(1).optional(),
  no_hp: z.string().optional(),
  alamat: z.string().optional(),
  is_active: z.boolean().optional(),
});