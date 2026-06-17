import { z } from "zod";

export const CreateMedicalRecordSchema = z.object({
  pet_id: z.string().uuid(),
  dokter_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional(),
  berat_saat_periksa: z.number().optional(),
  suhu: z.number().optional(),
  keluhan: z.string().optional(),
  diagnosis: z.string().min(1),
  tindakan: z.string().optional(),
  resep: z
    .array(
      z.object({
        nama_obat: z.string(),
        dosis: z.string(),
        frekuensi: z.string(),
        durasi: z.string(),
        qty: z.number(),
        aturan_pakai: z.string(),
      })
    )
    .optional(),
  catatan_followup: z.string().optional(),
  is_visible_customer: z.boolean().default(true),
});