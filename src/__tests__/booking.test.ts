import { vi } from "vitest";
import { CreateBookingSchema } from "@/lib/validations/booking";

describe("CreateBookingSchema — Zod validation", () => {
  it("should accept booking with customer_id", () => {
    const result = CreateBookingSchema.safeParse({
      slot_id: "550e8400-e29b-41d4-a716-446655440000",
      customer_id: "550e8400-e29b-41d4-a716-446655440001",
      nama_hewan: "Milo",
      spesies: "Kucing",
      keluhan: "Demam",
    });
    expect(result.success).toBe(true);
  });

  it("should accept booking with guest name and phone", () => {
    const result = CreateBookingSchema.safeParse({
      slot_id: "550e8400-e29b-41d4-a716-446655440000",
      nama_guest: "Budi",
      no_hp_guest: "08123456789",
      nama_hewan: "Milo",
      spesies: "Kucing",
    });
    expect(result.success).toBe(true);
  });

  it("should reject booking without customer_id or guest info", () => {
    const result = CreateBookingSchema.safeParse({
      slot_id: "550e8400-e29b-41d4-a716-446655440000",
      nama_hewan: "Milo",
      spesies: "Kucing",
    });
    expect(result.success).toBe(false);
  });

  it("should reject booking with guest name but no phone", () => {
    const result = CreateBookingSchema.safeParse({
      slot_id: "550e8400-e29b-41d4-a716-446655440000",
      nama_guest: "Budi",
      nama_hewan: "Milo",
      spesies: "Kucing",
    });
    expect(result.success).toBe(false);
  });
});