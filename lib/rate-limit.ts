/**
 * Distributed rate limiter using Cloudflare KV.
 *
 * Falls back to in-memory Map for local development (when KV is not bound).
 * In production on Cloudflare Workers, KV provides a globally consistent
 * counter that persists across all worker instances.
 *
 * Uses a fixed time-window approach: each window is identified by a
 * key + timestamp bucket (e.g. "login:user@example.com:1719000000").
 * The KV entry has a TTL of WINDOW_MS + buffer, so it auto-cleans.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_BUFFER_MS = 60 * 1000; // 1 minute buffer for KV TTL

// Minimal KVNamespace type — avoids requiring @cloudflare/workers-types.
// Only the methods we actually use are declared.
interface CloudflareKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

// ── In-memory fallback (local development only) ────────────────
const memoryAttempts = new Map<string, number[]>();
const MEMORY_MAX_KEYS = 1000;

function memoryCheck(key: string, maxAttempts = MAX_ATTEMPTS): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();

  if (memoryAttempts.size > MEMORY_MAX_KEYS) {
    const cutoff = now - WINDOW_MS;
    for (const [k, timestamps] of memoryAttempts) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] < cutoff) {
        memoryAttempts.delete(k);
      }
    }
  }

  const timestamps = (memoryAttempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length === 0) {
    memoryAttempts.delete(key);
  } else {
    memoryAttempts.set(key, timestamps);
  }

  if (timestamps.length >= maxAttempts) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
  }

  timestamps.push(now);
  memoryAttempts.set(key, timestamps);
  return { allowed: true };
}

// ── KV-based rate limiter ──────────────────────────────────────

function getKv(): CloudflareKV | null {
  // In Cloudflare Workers with OpenNext, KV bindings are injected into the
  // global scope, but may also be available via process.env or globalThis.
  // We try multiple paths for compatibility.
  const candidates = [
    (globalThis as Record<string, unknown>)["RATE_LIMIT_KV"],
    (globalThis as Record<string, unknown>)["__RATE_LIMIT_KV"],
    (process.env as Record<string, unknown>)["RATE_LIMIT_KV"],
  ] as const;
  for (const kv of candidates) {
    if (kv && typeof kv === "object" && typeof (kv as CloudflareKV).get === "function") {
      return kv as CloudflareKV;
    }
  }
  return null;
}

async function kvCheck(
  key: string,
  ip?: string,
  maxAttempts = MAX_ATTEMPTS
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const kv = getKv();
  if (!kv) {
    return memoryCheck(key, maxAttempts);
  }

  const effectiveKey = ip ? `${key}:ip:${ip}` : key;
  const now = Date.now();
  const windowBucket = Math.floor(now / WINDOW_MS);
  const kvKey = `rl:${effectiveKey}:${windowBucket}`;
  const ttlSeconds = Math.ceil((WINDOW_MS + WINDOW_BUFFER_MS) / 1000);

  try {
    // Read current count. KV is eventually consistent — a stale read may
    // allow 1-2 extra requests, which is acceptable for rate limiting.
    const raw = await kv.get(kvKey);
    const count = raw ? parseInt(raw, 10) : 0;

    if (count >= maxAttempts) {
      const windowStart = windowBucket * WINDOW_MS;
      const retryAfterMs = windowStart + WINDOW_MS - now;
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
    }

    // Increment. KV put is eventually consistent but the next read
    // will reflect this write within milliseconds.
    await kv.put(kvKey, String(count + 1), { expirationTtl: ttlSeconds });
    return { allowed: true };
  } catch {
    // KV failure — fall back to memory to avoid blocking all requests.
    return memoryCheck(key, maxAttempts);
  }
}

// ── Public API ─────────────────────────────────────────────────

export async function checkRateLimit(
  key: string,
  ip?: string,
  maxAttempts?: number
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  return kvCheck(key, ip, maxAttempts);
}

export function getClientIp(request: Request): string {
  // Cloudflare sets CF-Connecting-IP as the true client IP.
  // x-forwarded-for is the standard proxy header — take the first (leftmost) IP
  // which is the original client. Behind Cloudflare, this is always the real IP.
  // x-real-ip is set by some reverse proxies (nginx).
  // Fallback to empty string rather than "unknown" — an empty string prevents
  // grouping all unknown clients into a single rate-limit bucket which could
  // be exploited to cause collateral rate-limiting on legitimate users.
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    ""
  );
}
