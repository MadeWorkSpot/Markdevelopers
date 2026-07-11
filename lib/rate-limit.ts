const attempts = new Map<string, number[]>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_KEYS = 1000;

export function checkRateLimit(key: string, ip?: string): { allowed: boolean; retryAfterMs?: number } {
  const effectiveKey = ip ? `${key}:ip:${ip}` : key;
  const now = Date.now();

  if (attempts.size > MAX_KEYS) {
    const cutoff = now - WINDOW_MS;
    for (const [k, timestamps] of attempts) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] < cutoff) {
        attempts.delete(k);
      }
    }
  }

  const timestamps = (attempts.get(effectiveKey) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length === 0) {
    attempts.delete(effectiveKey);
  } else {
    attempts.set(effectiveKey, timestamps);
  }

  if (timestamps.length >= MAX_ATTEMPTS) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
  }

  timestamps.push(now);
  attempts.set(effectiveKey, timestamps);
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}
