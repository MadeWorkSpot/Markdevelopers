/**
 * Server-side Cloudflare Turnstile token verification.
 *
 * Verifies the Turnstile response token by calling Cloudflare's siteverify API.
 * This MUST be called on the server (not in the browser) because it requires
 * the TURNSTILE_SECRET_KEY which must never be exposed to the client.
 *
 * See: https://developers.cloudflare.com/turnstile/server-side-rendering/
 */

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  success: boolean;
  errorCodes?: string[];
}

/**
 * Verify a Turnstile token from the client.
 * Returns { success: true } if the token is valid, { success: false } otherwise.
 *
 * If TURNSTILE_SECRET_KEY is not configured, verification is skipped
 * (allows local development without Turnstile setup).
 */
export async function verifyTurnstile(token: string | null): Promise<TurnstileResult> {
  // If Turnstile is not configured, skip verification.
  // This allows local development without requiring a Turnstile secret.
  // In production, TURNSTILE_SECRET_KEY MUST be set.
  if (!TURNSTILE_SECRET_KEY) {
    console.warn("TURNSTILE_SECRET_KEY is not set — skipping Turnstile verification.");
    return { success: true };
  }

  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
      }),
    });

    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    return {
      success: data.success,
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return { success: false, errorCodes: ["verification-request-failed"] };
  }
}
