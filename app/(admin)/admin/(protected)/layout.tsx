import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import {
  SESSION_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  clearAuthCookies,
} from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!sessionCookie && !refreshToken) {
    await clearAuthCookies();
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
      await clearAuthCookies();
      redirect("/admin/login");
    }
    const refreshed = await tryRefresh(refreshToken);
    if (!refreshed) {
      await clearAuthCookies();
      redirect("/admin/login");
    }
    cookieStore.set(SESSION_COOKIE, refreshed.sessionCookie, {
      ...COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE,
    });
    if (refreshed.newRefreshToken) {
      cookieStore.set(REFRESH_TOKEN_COOKIE, refreshed.newRefreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });
    }
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

async function tryRefresh(
  refreshToken: string
): Promise<{ sessionCookie: string; newRefreshToken?: string } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) return null;

    const sessionCookie = await adminAuth.createSessionCookie(data.id_token, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });

    return {
      sessionCookie,
      newRefreshToken: data.refresh_token,
    };
  } catch {
    return null;
  }
}
