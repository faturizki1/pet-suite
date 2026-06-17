import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";

// Mock database
jest.mock("@/db/client", () => ({
  db: {
    query: {
      profiles: {
        findFirst: jest.fn(),
      },
    },
  },
}));

describe("hashPassword / verifyPassword", () => {
  it("should hash and verify password correctly", async () => {
    const plain = "testPassword123!";
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash.startsWith("$2a$")).toBe(true); // bcrypt hash prefix

    const valid = await verifyPassword(plain, hash);
    expect(valid).toBe(true);

    const invalid = await verifyPassword("wrongPassword", hash);
    expect(invalid).toBe(false);
  });

  it("should produce different hashes for same password", async () => {
    const plain = "samePassword";
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);
    expect(hash1).not.toBe(hash2); // bcrypt uses different salt each time
  });
});

describe("createSessionToken / verifySessionToken", () => {
  const originalEnv = process.env.JWT_SECRET;
  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret-key-min-32-chars-long!!";
  });
  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  it("should create and verify a valid token", async () => {
    const payload = { sub: "user-123", role: "owner" as const, is_active: true };
    const token = await createSessionToken(payload);
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe("user-123");
    expect(decoded!.role).toBe("owner");
    expect(decoded!.is_active).toBe(true);
  });

  it("should return null for invalid token", async () => {
    const result = await verifySessionToken("invalid-token-string");
    expect(result).toBeNull();
  });

  it("should return null for tampered token", async () => {
    const payload = { sub: "user-123", role: "owner" as const, is_active: true };
    const token = await createSessionToken(payload);
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = await verifySessionToken(tampered);
    expect(result).toBeNull();
  });
});

describe("assertActiveUser", () => {
  const { db } = require("@/db/client");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return user if active", async () => {
    const mockUser = { id: "user-1", isActive: true, role: "owner" };
    db.query.profiles.findFirst.mockResolvedValue(mockUser);

    const result = await assertActiveUser("user-1");
    expect(result).toEqual(mockUser);
  });

  it("should throw if user not found", async () => {
    db.query.profiles.findFirst.mockResolvedValue(null);

    await expect(assertActiveUser("nonexistent")).rejects.toThrow("UNAUTHORIZED_INACTIVE");
  });

  it("should throw if user is inactive", async () => {
    const mockUser = { id: "user-1", isActive: false, role: "owner" };
    db.query.profiles.findFirst.mockResolvedValue(mockUser);

    await expect(assertActiveUser("user-1")).rejects.toThrow("UNAUTHORIZED_INACTIVE");
  });
});