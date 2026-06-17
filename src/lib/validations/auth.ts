import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.literal("customer").default("customer"),
  nama_lengkap: z.string().min(1),
  no_hp: z.string().optional(),
  alamat: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});