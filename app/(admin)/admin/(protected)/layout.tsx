import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  SESSION_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!sessionCookie && !refreshToken) {
    redirect("/admin/login");
  }

  let sessionValid = false;

  if (sessionCookie) {
    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
      sessionValid = true;
    } catch {
      // Session invalid — try refresh below
    }
  }

  if (!sessionValid) {
    if (!refreshToken) {
      redirect("/admin/login");
    }
    redirect("/admin/api/session/refresh?redirect=" + encodeURIComponent("/admin/dashboard"));
  }

  let unreadCount = 0;
  try {
    const snapshot = await adminDb
      .collection("messages")
      .where("isRead", "==", false)
      .count()
      .get();
    unreadCount = snapshot.data().count;
  } catch {
    // Count query failure must not break the page
  }

  return <AdminShell unreadCount={unreadCount}>{children}</AdminShell>;
}
