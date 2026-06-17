import { z } from "zod";

export const UpdateClinicInfoSchema = z.object({
  nama_klinik: z.string().min(1).optional(),
  alamat: z.string().optional(),
  no_hp: z.string().optional(),
  email: z.string().email().optional(),
  jam_buka: z
    .array(
      z.object({
        hari: z.string(),
        jam_mulai: z.string(),
        jam_selesai: z.string(),
      })
    )
    .optional(),
  logo_url: z.string().optional(),
  footer_struk: z.string().optional(),
});