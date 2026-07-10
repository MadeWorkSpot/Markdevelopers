const attempts = new Map<string, number[]>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  attempts.set(key, timestamps);

  if (timestamps.length >= MAX_ATTEMPTS) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldest) };
  }

  timestamps.push(now);
  attempts.set(key, timestamps);
  return { allowed: true };
}
