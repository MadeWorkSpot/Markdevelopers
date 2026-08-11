import { describe, it, expect, beforeEach } from "vitest";
import {
  PASSWORD_RESET_TTL_MS,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_RESENDS,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_RESET_REQUEST_COOKIE,
  PASSWORD_RESET_TOKEN_COOKIE,
  GENERIC_RESET_MESSAGE,
  isValidEmail,
  isOtpFormat,
  passwordValidationError,
  generateOtp,
  generateResetToken,
  hashOtp,
  verifyOtpHash,
  constantTimeEqual,
  saveResetRecord,
  getResetRecord,
  deleteResetRecord,
  type ResetRecord,
} from "@/lib/password-reset";

function makeRecord(overrides: Partial<ResetRecord> = {}): ResetRecord {
  return {
    emailHash: "abc",
    email: "admin@example.com",
    uid: "uid-1",
    otpSalt: "salt",
    otpHash: "hash",
    expiresAt: Date.now() + PASSWORD_RESET_TTL_MS,
    attempts: 0,
    resendCount: 0,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe("constants", () => {
  it("sets the reset TTL to 10 minutes", () => {
    expect(PASSWORD_RESET_TTL_MS).toBe(10 * 60 * 1000);
  });

  it("allows 5 attempts and 3 resends", () => {
    expect(OTP_MAX_ATTEMPTS).toBe(5);
    expect(OTP_MAX_RESENDS).toBe(3);
  });

  it("exports cookie names", () => {
    expect(PASSWORD_RESET_REQUEST_COOKIE).toBe("password_reset_request");
    expect(PASSWORD_RESET_TOKEN_COOKIE).toBe("password_reset_token");
  });

  it("generic message never reveals account existence", () => {
    expect(GENERIC_RESET_MESSAGE).toContain("If an eligible admin account exists");
  });
});

describe("isValidEmail", () => {
  it("accepts well-formed emails", () => {
    expect(isValidEmail("admin@example.com")).toBe(true);
    expect(isValidEmail(" a@b.co ")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
  });
});

describe("isOtpFormat", () => {
  it("accepts exactly six digits", () => {
    expect(isOtpFormat("000000")).toBe(true);
    expect(isOtpFormat("123456")).toBe(true);
    expect(isOtpFormat("999999")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isOtpFormat("12345")).toBe(false);
    expect(isOtpFormat("1234567")).toBe(false);
    expect(isOtpFormat("12345a")).toBe(false);
    expect(isOtpFormat("")).toBe(false);
    expect(isOtpFormat(123456)).toBe(false);
    expect(isOtpFormat(null)).toBe(false);
  });
});

describe("passwordValidationError", () => {
  it("accepts passwords at least 12 chars", () => {
    expect(passwordValidationError("password-123")).toBeNull();
  });

  it("rejects short passwords", () => {
    expect(passwordValidationError("short")).toContain(`${PASSWORD_MIN_LENGTH}`);
  });

  it("rejects overly long passwords", () => {
    expect(passwordValidationError("x".repeat(PASSWORD_MAX_LENGTH + 1))).toContain(
      `${PASSWORD_MAX_LENGTH}`
    );
  });

  it("rejects non-string input", () => {
    expect(passwordValidationError(undefined)).toBe("Password must be a string.");
  });
});

describe("generateOtp", () => {
  it("always returns a six-digit code", () => {
    for (let i = 0; i < 1000; i++) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it("produces a broad spread of values (uniformity smoke test)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) {
      seen.add(generateOtp());
    }
    // Expected collisions over 5000 draws from 1e6 values is ~12.5; seeing
    // fewer than 50 distinct is effectively impossible for a uniform source.
    expect(seen.size).toBeGreaterThan(4900);
  });
});

describe("generateResetToken", () => {
  it("returns a 64-char hex token and is unique per call", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe("OTP hashing", () => {
  it("hashes and verifies correctly with the matching salt", async () => {
    const { salt, hash } = await hashOtp("123456");
    expect(hash).not.toContain("123456");
    await expect(verifyOtpHash("123456", salt, hash)).resolves.toBe(true);
  });

  it("rejects a wrong OTP", async () => {
    const { salt, hash } = await hashOtp("123456");
    await expect(verifyOtpHash("654321", salt, hash)).resolves.toBe(false);
  });

  it("uses a fresh random salt per hash", async () => {
    const a = await hashOtp("123456");
    const b = await hashOtp("123456");
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("constantTimeEqual", () => {
  it("compares equal strings", () => {
    expect(constantTimeEqual("abcdef", "abcdef")).toBe(true);
  });

  it("rejects unequal strings", () => {
    expect(constantTimeEqual("abcdee", "abcdeg")).toBe(false);
  });

  it("rejects different lengths", () => {
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });
});

describe("reset record storage", () => {
  beforeEach(() => {
    deleteResetRecord("test-request");
  });

  it("stores and retrieves a record", async () => {
    const record = makeRecord();
    await saveResetRecord("test-request", record);
    const got = await getResetRecord("test-request");
    expect(got).toEqual(record);
  });

  it("returns null for unknown records", async () => {
    await expect(getResetRecord("missing")).resolves.toBeNull();
  });

  it("returns null for expired records", async () => {
    await saveResetRecord("test-request", makeRecord({ expiresAt: Date.now() - 1 }));
    await expect(getResetRecord("test-request")).resolves.toBeNull();
  });

  it("deletes records", async () => {
    await saveResetRecord("test-request", makeRecord());
    await deleteResetRecord("test-request");
    await expect(getResetRecord("test-request")).resolves.toBeNull();
  });
});
