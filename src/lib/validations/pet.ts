import { z } from "zod";

export const CreatePetSchema = z.object({
  owner_id: z.string().uuid(),
  nama: z.string().min(1),
  spesies: z.string().min(1),
  ras: z.string().optional(),
  jenis_kelamin: z.enum(["jantan", "betina"]).optional(),
  tgl_lahir: z.string().optional(),
  berat_kg: z.number().optional(),
});