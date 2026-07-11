import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// POST handler — used by the server action form in AdminShell
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/admin/login");
}

// GET handler kept for backwards compatibility (e.g. direct browser navigation to /admin/logout)
// but redirects to login without actually clearing the cookie when used as a GET request,
// which prevents the CSRF logout-via-<img> attack vector.
// The real logout is always triggered via the POST server action form.
export async function GET() {
  redirect("/admin/login");
}
