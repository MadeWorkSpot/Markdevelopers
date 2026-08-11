/**
 * Password-reset / OTP helpers.
 *
 * Design notes:
 *  - The OTP is never stored in plaintext — only a salted SHA-256 hash.
 *  - Reset state lives in the existing KV binding (RATE_LIMIT_KV) under the
 *    `pr:` key prefix, keyed by a random request id (never the email).
 *  - Records expire via TTL (10 minutes) and are single-use.
 *  - When no KV binding is available (local dev / tests), an in-memory
 *    fallback keeps the flow working and testable.
 */

export const PASSWORD_RESET_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_RESENDS = 3;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_RESET_REQUEST_COOKIE = "password_reset_request";
export const PASSWORD_RESET_TOKEN_COOKIE = "password_reset_token";

/**
 * Identical user-facing response for every outcome of the request step. Never
 * reveals whether an account exists, is on the allowlist, or has a Firebase
 * user record.
 */
export const GENERIC_RESET_MESSAGE =
  "If an eligible admin account exists, a verification code has been sent.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_RE = /^\d{6}$/;

export function isValidEmail(email: unknown): boolean {
  return (
    typeof email === "string" &&
    email.trim().length > 0 &&
    email.trim().length <= 254 &&
    EMAIL_RE.test(email.trim())
  );
}

export function isOtpFormat(otp: unknown): boolean {
  return typeof otp === "string" && OTP_RE.test(otp);
}

export function passwordValidationError(password: unknown): string | null {
  if (typeof password !== "string") {
    return "Password must be a string.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  return null;
}

// ── Crypto primitives ──────────────────────────────────────────

export function randomBytesHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Uniform random 6-digit code (000000–999999) via rejection sampling over 24
 * random bits, mapped down to 0–999,999. The rejection region is an exact
 * multiple of 1_000_000 so the reduction is perfectly uniform. Never derived
 * from timestamps, counters, or Math.random().
 */
export function generateOtp(): string {
  const buf = new Uint8Array(3);
  // Largest multiple of 1_000_000 below 2^24: 16 * 1_000_000 = 16_000_000.
  const REJECT_THRESHOLD = 16_000_000;
  while (true) {
    crypto.getRandomValues(buf);
    const value = (buf[0] << 16) | (buf[1] << 8) | buf[2];
    if (value < REJECT_THRESHOLD) {
      return String(value % 1_000_000).padStart(6, "0");
    }
  }
}

export function generateResetToken(): string {
  return randomBytesHex(32); // 256-bit single-use reset authorization token
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashOtp(otp: string): Promise<{ salt: string; hash: string }> {
  const salt = randomBytesHex(16);
  const hash = await sha256Hex(`${salt}:${otp}`);
  return { salt, hash };
}

export async function verifyOtpHash(
  otp: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const candidate = await sha256Hex(`${salt}:${otp}`);
  return constantTimeEqual(candidate, expectedHash);
}

/** Constant-time string comparison — safe for HMAC/hash verification. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ── Reset record storage (KV with in-memory fallback) ─────────

export interface ResetRecord {
  /** SHA-256 of the normalized admin email — binds the record to the flow. */
  emailHash: string;
  /** Recipient email, needed only to resend the OTP. Never used as a key. */
  email: string;
  /** Firebase UID of the allowlisted admin account. */
  uid: string;
  otpSalt: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  resendCount: number;
  createdAt: number;
  verifiedAt?: number;
  resetTokenHash?: string;
}

interface CloudflareKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

function getKv(): CloudflareKV | null {
  // Mirrors the binding detection used by lib/rate-limit.ts. The same
  // RATE_LIMIT_KV binding is shared; password-reset records use the `pr:`
  // prefix so the two systems never collide.
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

const KEY_PREFIX = "pr:";

// In-memory fallback for local dev / tests (never used in production where
// the KV binding is present).
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

export async function saveResetRecord(
  requestId: string,
  record: ResetRecord
): Promise<void> {
  const json = JSON.stringify(record);
  const kv = getKv();
  if (kv) {
    const ttl = Math.max(
      1,
      Math.ceil((record.expiresAt - Date.now()) / 1000)
    );
    await kv.put(KEY_PREFIX + requestId, json, { expirationTtl: ttl });
  } else {
    memoryStore.set(KEY_PREFIX + requestId, { value: json, expiresAt: record.expiresAt });
  }
}

export async function getResetRecord(
  requestId: string
): Promise<ResetRecord | null> {
  const kv = getKv();
  let json: string | null = null;
  if (kv) {
    json = await kv.get(KEY_PREFIX + requestId);
  } else {
    const entry = memoryStore.get(KEY_PREFIX + requestId);
    if (entry && Date.now() < entry.expiresAt) {
      json = entry.value;
    } else if (entry) {
      memoryStore.delete(KEY_PREFIX + requestId);
    }
  }
  if (!json) return null;
  try {
    const record = JSON.parse(json) as ResetRecord;
    if (record.expiresAt <= Date.now()) return null;
    return record;
  } catch {
    return null;
  }
}

export async function deleteResetRecord(requestId: string): Promise<void> {
  const kv = getKv();
  if (kv) {
    await kv.delete(KEY_PREFIX + requestId);
  } else {
    memoryStore.delete(KEY_PREFIX + requestId);
  }
}
