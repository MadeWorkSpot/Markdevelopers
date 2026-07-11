import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import AdminShell from "@/components/admin/AdminShell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) redirect("/admin/login");
  try {
    await adminAuth.verifySessionCookie(sessionCookie, false);
  } catch {
    redirect("/admin/login");
  }
  const snapshot = await adminDb
    .collection("messages")
    .where("isRead", "==", false)
    .count()
    .get();
  const unreadCount = snapshot.data().count;
  return <AdminShell unreadCount={unreadCount}>{children}</AdminShell>;
}
