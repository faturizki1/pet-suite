/**
 * In-memory sliding window rate limiter (Map-based, no external deps).
 * Tracks failed attempts per key (IP+email combo) with a sliding window.
 */

interface RateLimitEntry {
  attempts: number;
  windowStart: number; // timestamp in ms
}

const store = new Map<string, RateLimitEntry>();

// Default: 5 attempts per 15 minutes
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if a given key is rate-limited.
 * Returns { allowed, remaining, resetInMs }.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowMs: number = DEFAULT_WINDOW_MS
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    // First attempt — create entry
    store.set(key, { attempts: 1, windowStart: now });
    return { allowed: true, remaining: maxAttempts - 1, resetInMs: windowMs };
  }

  const elapsed = now - entry.windowStart;

  if (elapsed >= windowMs) {
    // Window expired — reset
    store.set(key, { attempts: 1, windowStart: now });
    return { allowed: true, remaining: maxAttempts - 1, resetInMs: windowMs };
  }

  // Within window
  if (entry.attempts >= maxAttempts) {
    const resetInMs = windowMs - elapsed;
    return { allowed: false, remaining: 0, resetInMs };
  }

  // Increment
  entry.attempts += 1;
  return { allowed: true, remaining: maxAttempts - entry.attempts, resetInMs: windowMs - elapsed };
}

/**
 * Reset rate limit for a given key (e.g. on successful login).
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Build a rate limit key from IP and email.
 */
export function buildRateLimitKey(ip: string, email: string): string {
  return `login:${ip}:${email}`;
}

/**
 * Periodic cleanup of expired entries to prevent memory leak.
 * Call this on server startup or via setInterval.
 */
export function cleanupExpiredEntries(windowMs: number = DEFAULT_WINDOW_MS): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart >= windowMs) {
      store.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
if (typeof setInterval !== "undefined") {
  setInterval(() => cleanupExpiredEntries(), CLEANUP_INTERVAL_MS);
}