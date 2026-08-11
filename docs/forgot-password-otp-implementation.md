# Forgot Password / Change Password with OTP — Implementation Report

Status: implemented, verified, not committed, not deployed.

## 1. Files changed

New files:

- `lib/password-reset.ts` — OTP + reset-authorization primitives and KV-backed reset records.
- `lib/resend.ts` — shared Resend helper (`sendEmail`, `sendResetOtpEmail`).
- `app/(admin)/admin/forgot/page.tsx` + `forgot-form.tsx` — email request step.
- `app/(admin)/admin/forgot/otp/page.tsx` + `otp-form.tsx` — OTP entry + resend step.
- `app/(admin)/admin/forgot/reset/page.tsx` + `reset-form.tsx` — new-password step.
- `app/(admin)/admin/(protected)/dashboard/security/page.tsx` — Security dashboard page.
- `components/admin/ChangePasswordForm.tsx` — change-password form for logged-in admins.
- `tests/password-reset.test.ts` — lib unit tests (25).
- `tests/actions-reset.test.ts` — action/flow unit tests (26).

Modified files:

- `actions.ts` — `requireAdminSession` refactor; `requestPasswordReset`, `resendOtp`,
  `verifyOtp`, `resetPassword`, `changePassword`; `submitContact` now uses `sendEmail`.
- `middleware.ts` — `/admin/forgot*` treated as session-less routes on the admin host.
- `lib/auth.ts` — `isProtectedRoute` excludes `/admin/forgot*`.
- `app/(admin)/admin/login/login-form.tsx` — "Forgot password?" link.
- `components/admin/AdminShell.tsx` — "Security" nav item.
- `tests/middleware.test.ts`, `__tests__/security/auth.test.ts` — routing/route tests.
- `tests/e2e/smoke.spec.ts` — public/forgot host-routing E2E tests.

## 2. Forgot-password flow

1. **Request** — `/admin/forgot`. Server action validates the email, applies per-email
   (3/15 min) and per-IP (10/15 min) rate limits, then checks the fail-closed admin
   allowlist and looks up the Firebase user. Every outcome returns the identical
   generic message; non-eligible paths add a fixed 300 ms delay so timing does not
   leak account existence.
2. **OTP entry** — `/admin/forgot/otp` (requires the `password_reset_request` cookie).
   Six-digit code with 5-attempt limit, 3 resends max, 10-minute expiry, single-use.
3. **New password** — `/admin/forgot/reset` (requires the `password_reset_token`
   cookie). Validates 12–128 chars + confirmation, updates Firebase, revokes all
   sessions, consumes the reset.

## 3. OTP generation and storage

- `generateOtp()`: 24 random bits via `crypto.getRandomValues`, rejection sampling
  with an exact multiple-of-1,000,000 threshold, reduced mod 1,000,000 → uniform
  000000–999999. No `Math.random`, timestamps, or counters.
- Only a **salted SHA-256 hash** of the OTP is stored (`salt:otp`), verified with a
  constant-time comparison. The plaintext OTP exists only in the outbound email.
- Reset state lives in the existing `RATE_LIMIT_KV` binding under the `pr:` prefix,
  keyed by a random request id (never the email), with TTL expiry and an in-memory
  fallback for local dev/tests.

## 4. Rate limiting

All limits use the existing KV-backed `checkRateLimit` (per email/IP as noted):

| Key | Limit | Window |
|---|---|---|
| `pr-email:<emailHash>` | 3 | 15 min |
| `pr-ip` (request) | 10 | 15 min |
| `pr-resend-ip` | 10 | 15 min |
| `pr-verify-ip` | 20 | 15 min |
| `pr-reset-ip` | 10 | 15 min |
| `pr-change:<uid>` | 5 | 15 min |
| `pr-change-ip` | 10 | 15 min |

## 5. Reset authorization mechanism

- OTP success mints a 256-bit random reset token (`generateResetToken`); only its
  SHA-256 hash is stored. The token travels in a path-scoped, HttpOnly, Secure,
  SameSite=strict cookie (`password_reset_token`, path `/admin/forgot/reset`,
  10-min TTL) — never in the URL.
- A second cookie (`password_reset_request`, path `/admin/forgot`) binds the browser
  to the stored record id. No cookie ever contains the email or a usable token.
- The reset is single-use: after a successful `resetPassword` the record is deleted
  and both cookies are cleared. Replays, tampered tokens, missing cookies, and
  expired records all return the same generic error and never call `updateUser`.
- The reset never creates a session; the admin must log in with the new password.

## 6. Change password (logged-in admin)

- `Security` dashboard page at `/admin/dashboard/security`, exposed via the sidebar.
- `changePassword` verifies the **current** password against Firebase
  (`accounts:signInWithPassword` via identitytoolkit REST) before allowing any
  change, then applies 12–128 char validation and confirmation matching.
- On success: `updateUser`, `revokeRefreshTokens`, and `clearAuthCookies` — all
  prior sessions are invalidated and the admin is signed out to log in again.
- Wrong current password, invalid session, and per-user/per-IP rate limits all
  return generic errors with no side effects.

## 7. Session behavior

- Forgot/reset routes are reachable without a session on the admin host only;
  any logged-in visitor is redirected to `/admin/dashboard`. On public or
  lookalike hosts all `/admin/forgot*` routes rewrite to `/_not-found`.
- `requireAdmin` was refactored into `requireAdminSession` (returns the verified
  `DecodedSession`) + a thin `requireAdmin` wrapper, keeping the existing
  fail-closed allowlist and revoked-check behavior intact.

## 8. Tests added

- `tests/password-reset.test.ts` (25): constants, email/OTP/password validation,
  OTP uniformity smoke test, token uniqueness, salted hashing, constant-time
  comparison, record storage/TTL/deletion.
- `tests/actions-reset.test.ts` (26): full request → verify → reset flow, generic
  no-enumeration responses (non-allowlisted, missing user, send failure), rate
  limiting, resend cap, 5-attempt invalidation, OTP replay rejection, tampered /
  missing / replayed reset tokens, weak/mismatched passwords, change-password
  current-password verification, session revocation, and unauthorized handling.
- Routing tests added to `tests/middleware.test.ts` and
  `__tests__/security/auth.test.ts`.
- E2E: `tests/e2e/smoke.spec.ts` now covers public-host 404 for the whole
  `/admin/forgot*` flow and admin-host access without a session.

## 9. Verification results

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npm run lint` | clean (1 pre-existing warning in `tests/content-manager.test.tsx`) |
| `npm test` | **237/237 passed** (16 files; was 181/181 before this feature) |
| `npx vitest run tests/check-build-secrets.test.ts` | 6/6 passed |
| `opennextjs-cloudflare build` (public-only env) | success |
| `node scripts/check-build-secrets.mjs` | no server secrets found |
| `npm audit` | 0 vulnerabilities |
| Playwright E2E | **12/12 passed** (was 10/10 before) |

## 10. Security considerations

- Account existence is never revealed: identical generic messages and a fixed
  300 ms delay on non-eligible paths.
- OTPs and reset tokens are never stored in plaintext, logged, or placed in URLs.
- All rate limits are keyed by email hash and IP and shared through the existing
  KV infrastructure.
- Reset authorization is short-lived, single-use, HttpOnly, and never reissued.
- Password changes revoke every session and force re-login.
- No new environment variables are required: the existing `RESEND_API_KEY` is
  used (optional `RESEND_FROM` override supported).
- Not committed and not deployed; `.env` restored after the public-only build
  verification.
