import { z } from "zod";

export const CreateAppointmentSchema = z.object({
  pet_id: z.string().uuid(),
  dokter_id: z.string().uuid().optional(),
  tgl_janji: z.string(),
  jenis: z.enum(["konsultasi", "grooming", "operasi", "vaksin", "lainnya"]),
  keluhan: z.string().optional(),
});

export const UpdateAppointmentSchema = z.object({
  status: z.enum(["pending", "konfirmasi", "selesai", "batal"]),
  catatan_staff: z.string().optional(),
});