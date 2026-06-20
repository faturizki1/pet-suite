import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import {
  checkRateLimit,
  resetRateLimit,
  buildRateLimitKey,
  cleanupExpiredEntries,
} from "@/lib/auth/rate-limit";

// Mock database — vi.mock is hoisted, so use vi.hoisted for the factory
const mockFindFirst = vi.hoisted(() => vi.fn());
vi.mock("@/db/client", () => ({
  db: {
    query: {
      profiles: {
        findFirst: mockFindFirst,
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user if active", async () => {
    const mockUser = { id: "user-1", isActive: true, role: "owner" };
    mockFindFirst.mockResolvedValue(mockUser);

    const result = await assertActiveUser("user-1");
    expect(result).toEqual(mockUser);
  });

  it("should throw if user not found", async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(assertActiveUser("nonexistent")).rejects.toThrow("UNAUTHORIZED_INACTIVE");
  });

  it("should throw if user is inactive", async () => {
    const mockUser = { id: "user-1", isActive: false, role: "owner" };
    mockFindFirst.mockResolvedValue(mockUser);

    await expect(assertActiveUser("user-1")).rejects.toThrow("UNAUTHORIZED_INACTIVE");
  });
});

describe("Rate Limiting — checkRateLimit / resetRateLimit", () => {
  beforeEach(() => {
    // Clean up any leftover entries from previous tests
    cleanupExpiredEntries(0); // force-clear by setting window to 0
  });

  it("should allow first attempt", () => {
    const result = checkRateLimit("test:user@example.com", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should block after max attempts", () => {
    const key = "test:block@example.com";
    // 5 attempts are allowed (remaining: 4,3,2,1,0)
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
    // 6th attempt should be blocked
    const blocked = checkRateLimit(key, 5, 60000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("should reset after window expires", () => {
    const key = "test:expire@example.com";
    // Use up all 5 allowed attempts
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 50); // 50ms window
    }
    // 6th attempt should be blocked
    expect(checkRateLimit(key, 5, 50).allowed).toBe(false);

    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = checkRateLimit(key, 5, 50);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
        resolve();
      }, 60);
    });
  });

  it("should reset on successful login", () => {
    const key = "test:reset@example.com";
    // Use up all 5 allowed attempts
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60000);
    }
    // 6th attempt should be blocked
    expect(checkRateLimit(key, 5, 60000).allowed).toBe(false);

    // Reset (simulates successful login)
    resetRateLimit(key);
    const result = checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("should build correct key from IP and email", () => {
    const key = buildRateLimitKey("192.168.1.1", "user@test.com");
    expect(key).toBe("login:192.168.1.1:user@test.com");
  });

  it("should handle different keys independently", () => {
    const key1 = "user1@example.com";
    const key2 = "user2@example.com";

    // Exhaust key1
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key1, 5, 60000);
    }
    expect(checkRateLimit(key1, 5, 60000).allowed).toBe(false);

    // key2 should still be allowed
    expect(checkRateLimit(key2, 5, 60000).allowed).toBe(true);
  });
});
