/**
 * Shared Resend email helper.
 *
 * Reads the API key and verified sender from runtime secrets only — never
 * hardcoded. RESEND_FROM is optional and falls back to the existing verified
 * sender so no new configuration is required.
 */

const DEFAULT_FROM = "Mark Developers <noreply@markdevelopers.in>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  const from = process.env.RESEND_FROM || DEFAULT_FROM;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  });
  if (!res.ok) {
    throw new Error(`Resend email failed: ${res.status}`);
  }
}

export async function sendResetOtpEmail(to: string, otp: string): Promise<void> {
  await sendEmail({
    to,
    subject: "Admin Password Reset Verification Code",
    html: [
      "<p>We received a request to reset the password for your admin account.</p>",
      `<p>Your verification code is: <strong>${otp}</strong></p>`,
      "<p>This code expires in 10 minutes.</p>",
      "<p>If you did not request this, you can ignore this email.</p>",
      "<p>Never share this code with anyone.</p>",
    ].join(""),
  });
}
