import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "@/actions";
import { getSessionUserId } from "@/lib/auth";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const userId = getSessionUserId(session);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Log out
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-5xl px-8 py-12">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Welcome{userId ? `, User #${userId}` : ""}!
          </h2>
          <p className="text-gray-600">
            You are logged in to the admin panel.
          </p>
        </div>
      </main>
    </div>
  );
}
