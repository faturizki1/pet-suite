import { z } from "zod";

export const CreateInpatientSchema = z.object({
  pet_id: z.string().uuid(),
  dokter_id: z.string().uuid(),
  no_kandang: z.string().min(1),
  diagnosis_awal: z.string().optional(),
  tindakan_awal: z.string().optional(),
});

export const CreateInpatientLogSchema = z.object({
  kondisi: z.enum(["kritis", "lemah", "stabil", "baik", "sangat_baik"]),
  berat: z.number().optional(),
  suhu: z.number().optional(),
  nafsu_makan: z
    .enum(["tidak_mau", "sedikit", "normal", "lahap"])
    .optional(),
  catatan_kondisi: z.string().min(1),
  tindakan_hari_ini: z.string().optional(),
  obat_hari_ini: z.string().optional(),
  foto_urls: z.array(z.string().url()).max(5).optional(),
  is_visible_customer: z.boolean().default(true),
});
