import { adminAuth } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return new Response(null, { status: 302, headers: { Location: "/admin/login" } });
  }

  const rl = checkRateLimit(`login:${email}`, ip);
  if (!rl.allowed) {
    return new Response(null, { status: 302, headers: { Location: "/admin/login" } });
  }

  let sessionCookie: string;
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return new Response(null, { status: 302, headers: { Location: "/admin/login" } });
    }

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return new Response(null, { status: 302, headers: { Location: "/admin/login" } });
    }

    sessionCookie = await adminAuth.createSessionCookie(data.idToken, {
      expiresIn: 60 * 60 * 24 * 1000,
    });
  } catch {
    return new Response(null, { status: 302, headers: { Location: "/admin/login" } });
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/admin/dashboard",
      "Set-Cookie": `session=${sessionCookie}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24}; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    },
  });
}
