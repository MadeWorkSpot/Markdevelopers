import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";

// POST handler — used by the server action form in AdminShell.
// Revokes Firebase refresh tokens AND deletes the session cookie,
// matching the security level of the server action logout in actions.ts.
export async function POST() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (sessionCookie) {
    try {
      const session = await adminAuth.verifySessionCookie(sessionCookie);
      const uid = session.sub || session.user_id;
      if (uid) await adminAuth.revokeRefreshTokens(uid);
    } catch {
      // Session invalid — cookie will be deleted regardless.
    }
  }
  cookieStore.delete("session");
  cookieStore.delete("refresh_token");
  redirect("/admin/login");
}

// GET handler — redirects to login WITHOUT clearing the cookie.
// This prevents CSRF logout-via-<img> attack where an attacker embeds
// <img src="https://admin.example.com/admin/logout"> to force logout.
// The real logout is always triggered via POST.
export async function GET() {
  redirect("/admin/login");
}
