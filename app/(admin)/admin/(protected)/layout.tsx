import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";
import { getUnreadCount } from "@/actions";
import AdminShell from "@/components/admin/AdminShell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) redirect("/admin/login");
  try {
    await adminAuth.verifySessionCookie(sessionCookie);
  } catch {
    cookieStore.delete("session");
    redirect("/admin/login");
  }
  const unreadCount = await getUnreadCount();
  return <AdminShell unreadCount={unreadCount}>{children}</AdminShell>;
}
