export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${to}: ${otp}`);
    }
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mark Developers <no-reply@markdevelopers.in>",
        to,
        subject: "Your verification code",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;">
            <h2 style="color:#111;">Verify your email</h2>
            <p style="color:#555;">Use the code below to complete your registration:</p>
            <div style="background:#f5f5f5;text-align:center;padding:24px;border-radius:8px;margin:24px 0;">
              <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#000;">${otp}</span>
            </div>
            <p style="color:#888;font-size:14px;">This code expires in 10 minutes.</p>
          </div>
        `,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
