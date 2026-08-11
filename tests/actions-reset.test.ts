import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => {
  const jar = new Map<string, string>();
  return {
    jar,
    lastOtp: { value: "" },
    reset: () => jar.clear(),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: (name: string) => {
      const value = h.jar.get(name);
      return value ? { value } : undefined;
    },
    set: (name: string, value: string) => {
      h.jar.set(name, value);
    },
    delete: (name: string) => {
      h.jar.delete(name);
    },
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: {
    verifySessionCookie: vi
      .fn()
      .mockResolvedValue({ sub: "uid-1", email: "admin@example.com" }),
    getUserByEmail: vi.fn(),
    updateUser: vi.fn().mockResolvedValue({}),
    revokeRefreshTokens: vi.fn().mockResolvedValue({}),
  },
  adminDb: {
    collection: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
  getClientIpFromHeaders: vi.fn().mockResolvedValue("127.0.0.1"),
}));

vi.mock("@/lib/auth", () => ({
  clearAuthCookies: vi.fn().mockResolvedValue(undefined),
  assertAdminEmail: vi.fn(),
  isAdminEmail: vi.fn().mockReturnValue(true),
  getCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  }),
}));

vi.mock("@/lib/resend", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  sendResetOtpEmail: vi.fn().mockImplementation(async (_to: string, otp: string) => {
    h.lastOtp.value = otp;
  }),
}));

import { adminAuth } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { isAdminEmail, clearAuthCookies } from "@/lib/auth";
import { sendResetOtpEmail } from "@/lib/resend";
import {
  getResetRecord,
  PASSWORD_RESET_REQUEST_COOKIE,
  PASSWORD_RESET_TOKEN_COOKIE,
} from "@/lib/password-reset";
import {
  requestPasswordReset,
  resendOtp,
  verifyOtp,
  resetPassword,
  changePassword,
} from "@/actions";

const { getUserByEmail } = adminAuth;

const REQUEST_COOKIE = PASSWORD_RESET_REQUEST_COOKIE;
const TOKEN_COOKIE = PASSWORD_RESET_TOKEN_COOKIE;

function formWith(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

function stubEmailSending() {
  vi.mocked(sendResetOtpEmail).mockImplementation(async (_to: string, otp: string) => {
    h.lastOtp.value = otp;
  });
}

function aWrongOtp(): string {
  return h.lastOtp.value === "000000" ? "111111" : "000000";
}

async function resetRequestId(): Promise<string | undefined> {
  return h.jar.get(REQUEST_COOKIE);
}

describe("requestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.reset();
    h.lastOtp.value = "";
    vi.mocked(isAdminEmail).mockReturnValue(true);
    vi.mocked(getUserByEmail).mockResolvedValue({ uid: "uid-1" } as never);
    stubEmailSending();
  });

  it("rejects an invalid email without sending anything", async () => {
    const result = await requestPasswordReset(null, formWith({ email: "not-an-email" }));
    expect(result).toEqual({ error: "Please enter a valid email address." });
    expect(sendResetOtpEmail).not.toHaveBeenCalled();
    expect(h.jar.has(REQUEST_COOKIE)).toBe(false);
  });

  it("sends a code and sets the request cookie for an eligible admin", async () => {
    const result = await requestPasswordReset(null, formWith({ email: "Admin@Example.com " }));
    expect(result).toEqual({
      success: true,
      message: expect.stringContaining("If an eligible admin account exists"),
    });
    expect(sendResetOtpEmail).toHaveBeenCalledWith("admin@example.com", expect.stringMatching(/^\d{6}$/));
    expect(h.jar.has(REQUEST_COOKIE)).toBe(true);
  });

  it("returns the generic message and sends nothing for a non-allowlisted email", async () => {
    vi.mocked(isAdminEmail).mockReturnValue(false);
    const result = await requestPasswordReset(null, formWith({ email: "admin@example.com" }));
    expect(result.success).toBe(true);
    expect(sendResetOtpEmail).not.toHaveBeenCalled();
    expect(getUserByEmail).not.toHaveBeenCalled();
    expect(h.jar.has(REQUEST_COOKIE)).toBe(false);
  });

  it("returns the generic message when the Firebase user does not exist", async () => {
    vi.mocked(getUserByEmail).mockRejectedValue(new Error("not found"));
    const result = await requestPasswordReset(null, formWith({ email: "admin@example.com" }));
    expect(result.success).toBe(true);
    expect(sendResetOtpEmail).not.toHaveBeenCalled();
    expect(h.jar.has(REQUEST_COOKIE)).toBe(false);
  });

  it("respects the per-email rate limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ allowed: false } as never);
    const result = await requestPasswordReset(null, formWith({ email: "admin@example.com" }));
    expect(result).toEqual({ error: "Too many requests. Try again later." });
    expect(sendResetOtpEmail).not.toHaveBeenCalled();
  });

  it("drops the record when the email fails to send but still returns success", async () => {
    vi.mocked(sendResetOtpEmail).mockRejectedValue(new Error("resend down"));
    const result = await requestPasswordReset(null, formWith({ email: "admin@example.com" }));
    expect(result.success).toBe(true);
    expect(h.jar.has(REQUEST_COOKIE)).toBe(false);
  });
});

describe("resendOtp", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    h.reset();
    h.lastOtp.value = "";
    vi.mocked(isAdminEmail).mockReturnValue(true);
    vi.mocked(getUserByEmail).mockResolvedValue({ uid: "uid-1" } as never);
    stubEmailSending();
    await requestPasswordReset(null, formWith({ email: "admin@example.com" }));
  });

  it("re-sends a fresh code and increments the resend count", async () => {
    const first = h.lastOtp.value;
    const result = await resendOtp();
    expect(result).toEqual({ success: true });
    expect(sendResetOtpEmail).toHaveBeenCalledTimes(2);
    expect(h.lastOtp.value).not.toBe(first);
  });

  it("rejects when no request cookie exists", async () => {
    h.reset();
    const result = await resendOtp();
    expect(result).toEqual({ error: "Invalid or expired verification code." });
    expect(sendResetOtpEmail).toHaveBeenCalledTimes(1);
  });

  it("rejects when the resend limit is reached", async () => {
    await resendOtp();
    await resendOtp();
    await resendOtp();
    const result = await resendOtp();
    expect(result).toEqual({ error: "Too many requests. Try again later." });
  });
});

describe("verifyOtp", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    h.reset();
    h.lastOtp.value = "";
    vi.mocked(isAdminEmail).mockReturnValue(true);
    vi.mocked(getUserByEmail).mockResolvedValue({ uid: "uid-1" } as never);
    stubEmailSending();
    await requestPasswordReset(null, formWith({ email: "admin@example.com" }));
  });

  it("rejects a malformed OTP", async () => {
    const result = await verifyOtp(null, formWith({ otp: "abc" }));
    expect(result).toEqual({ error: "Invalid or expired verification code." });
  });

  it("accepts the correct OTP and issues a reset token", async () => {
    const result = await verifyOtp(null, formWith({ otp: h.lastOtp.value }));
    expect(result).toEqual({ success: true });
    expect(h.jar.get(TOKEN_COOKIE)).toBeTruthy();
  });

  it("rejects a wrong OTP without revealing anything", async () => {
    const result = await verifyOtp(null, formWith({ otp: aWrongOtp() }));
    expect(result).toEqual({ error: "Invalid or expired verification code." });
  });

  it("invalidates the request after 5 wrong attempts", async () => {
    for (let i = 0; i < 5; i++) {
      await verifyOtp(null, formWith({ otp: aWrongOtp() }));
    }
    const requestId = await resetRequestId();
    await expect(getResetRecord(requestId!)).resolves.toBeNull();
  });

  it("cannot reuse a consumed OTP", async () => {
    await verifyOtp(null, formWith({ otp: h.lastOtp.value }));
    const result = await verifyOtp(null, formWith({ otp: h.lastOtp.value }));
    expect(result).toEqual({ error: "Invalid or expired verification code." });
  });

  it("rejects when no request cookie exists", async () => {
    h.reset();
    const result = await verifyOtp(null, formWith({ otp: "123456" }));
    expect(result).toEqual({ error: "Invalid or expired verification code." });
  });
});

describe("resetPassword", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    h.reset();
    h.lastOtp.value = "";
    vi.mocked(isAdminEmail).mockReturnValue(true);
    vi.mocked(getUserByEmail).mockResolvedValue({ uid: "uid-1" } as never);
    stubEmailSending();
    await requestPasswordReset(null, formWith({ email: "admin@example.com" }));
    await verifyOtp(null, formWith({ otp: h.lastOtp.value }));
  });

  it("updates the password, revokes tokens, and consumes the reset", async () => {
    const result = await resetPassword(
      null,
      formWith({ password: "new-password-123", confirmPassword: "new-password-123" })
    );
    expect(result).toEqual({ success: true });
    expect(adminAuth.updateUser).toHaveBeenCalledWith("uid-1", { password: "new-password-123" });
    expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith("uid-1");
    const requestId = await resetRequestId();
    await expect(getResetRecord(requestId!)).resolves.toBeNull();
    expect(h.jar.has(TOKEN_COOKIE)).toBe(false);
    expect(h.jar.has(REQUEST_COOKIE)).toBe(false);
  });

  it("rejects a weak password", async () => {
    const result = await resetPassword(
      null,
      formWith({ password: "short", confirmPassword: "short" })
    );
    expect(result.error).toContain("at least");
    expect(adminAuth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    const result = await resetPassword(
      null,
      formWith({ password: "new-password-123", confirmPassword: "different-123" })
    );
    expect(result).toEqual({ error: "Passwords do not match." });
    expect(adminAuth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects when the reset token cookie is missing", async () => {
    h.jar.delete(TOKEN_COOKIE);
    const result = await resetPassword(
      null,
      formWith({ password: "new-password-123", confirmPassword: "new-password-123" })
    );
    expect(result).toEqual({ error: "Invalid or expired reset session." });
    expect(adminAuth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects a tampered reset token", async () => {
    h.jar.set(TOKEN_COOKIE, h.jar.get(TOKEN_COOKIE)!.slice(0, -1) + "0");
    const result = await resetPassword(
      null,
      formWith({ password: "new-password-123", confirmPassword: "new-password-123" })
    );
    expect(result).toEqual({ error: "Invalid or expired reset session." });
    expect(adminAuth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects a replay after the reset is consumed", async () => {
    await resetPassword(
      null,
      formWith({ password: "new-password-123", confirmPassword: "new-password-123" })
    );
    h.jar.set(TOKEN_COOKIE, "restored-token");
    h.jar.set(REQUEST_COOKIE, "restored-request");
    const result = await resetPassword(
      null,
      formWith({ password: "another-password-456", confirmPassword: "another-password-456" })
    );
    expect(result).toEqual({ error: "Invalid or expired reset session." });
    expect(adminAuth.updateUser).toHaveBeenCalledTimes(1);
  });
});

describe("changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.reset();
    h.jar.set("session", "mock-session");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "test-api-key");
    vi.mocked(adminAuth.verifySessionCookie).mockResolvedValue({
      sub: "uid-1",
      email: "admin@example.com",
    } as never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("changes the password and revokes all sessions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const result = await changePassword(
      null,
      formWith({
        currentPassword: "current-pass-123",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      })
    );
    expect(result).toEqual({ success: true });
    expect(adminAuth.updateUser).toHaveBeenCalledWith("uid-1", { password: "new-password-123" });
    expect(adminAuth.revokeRefreshTokens).toHaveBeenCalledWith("uid-1");
    expect(clearAuthCookies).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("rejects an incorrect current password", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400 }));
    const result = await changePassword(
      null,
      formWith({
        currentPassword: "wrong-pass-123",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      })
    );
    expect(result).toEqual({ error: "Current password is incorrect." });
    expect(adminAuth.updateUser).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("rejects when the session is invalid", async () => {
    vi.mocked(adminAuth.verifySessionCookie).mockRejectedValue(new Error("expired"));
    const result = await changePassword(
      null,
      formWith({
        currentPassword: "current-pass-123",
        newPassword: "new-password-123",
        confirmPassword: "new-password-123",
      })
    );
    expect(result).toEqual({ error: "Unauthorized." });
    expect(adminAuth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects a weak new password", async () => {
    const result = await changePassword(
      null,
      formWith({
        currentPassword: "current-pass-123",
        newPassword: "short",
        confirmPassword: "short",
      })
    );
    expect(result.error).toContain("at least");
    expect(adminAuth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects mismatched confirmation", async () => {
    const result = await changePassword(
      null,
      formWith({
        currentPassword: "current-pass-123",
        newPassword: "new-password-123",
        confirmPassword: "different-123",
      })
    );
    expect(result).toEqual({ error: "Passwords do not match." });
    expect(adminAuth.updateUser).not.toHaveBeenCalled();
  });
});
