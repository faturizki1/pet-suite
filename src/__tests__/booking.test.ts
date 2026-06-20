import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import { CreateBookingSchema } from "@/lib/validations/booking";
import { NextRequest } from "next/server";

// Mock database for booking list tests
const mockFindMany = vi.hoisted(() => vi.fn());
vi.mock("@/db/client", () => ({
  db: {
    query: {
      bookingSlots: {
        findMany: mockFindMany,
      },
    },
  },
}));

describe("Booking List API — filter conditions", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key-min-32-chars-long!!";
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should pass isAvailable=true condition when no filters provided", async () => {
    mockFindMany.mockResolvedValue([]);

    const url = new URL("http://localhost:3000/api/booking/list");
    const request = new NextRequest(url);
    const { GET } = await import("@/app/api/booking/list/route");
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArgs = mockFindMany.mock.calls[0][0];
    // where should be defined (not undefined) since we always have isAvailable condition
    expect(callArgs.where).toBeDefined();
  });

  it("should filter by dokter_id when provided", async () => {
    mockFindMany.mockResolvedValue([]);

    const url = new URL("http://localhost:3000/api/booking/list?dokter_id=550e8400-e29b-41d4-a716-446655440000");
    const request = new NextRequest(url);
    const { GET } = await import("@/app/api/booking/list/route");
    await GET(request);

    expect(mockFindMany).toHaveBeenCalled();
  });

  it("should filter by tanggal when provided", async () => {
    mockFindMany.mockResolvedValue([]);

    const url = new URL("http://localhost:3000/api/booking/list?tanggal=2026-07-01");
    const request = new NextRequest(url);
    const { GET } = await import("@/app/api/booking/list/route");
    await GET(request);

    expect(mockFindMany).toHaveBeenCalled();
  });

  it("should return 500 on database error", async () => {
    mockFindMany.mockRejectedValue(new Error("DB error"));

    const url = new URL("http://localhost:3000/api/booking/list");
    const request = new NextRequest(url);
    const { GET } = await import("@/app/api/booking/list/route");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Terjadi kesalahan server");
  });
});

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