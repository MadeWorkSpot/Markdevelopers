import { cookies } from "next/headers";
import Link from "next/link";
import { GENERIC_RESET_MESSAGE, PASSWORD_RESET_REQUEST_COOKIE } from "@/lib/password-reset";
import { OtpForm } from "./otp-form";

export default async function OtpPage() {
  const cookieStore = await cookies();
  const hasRequest = Boolean(cookieStore.get(PASSWORD_RESET_REQUEST_COOKIE)?.value);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <h1 className="text-lg font-medium text-white sm:text-xl">Verify your email</h1>
          <p className="mt-1 text-sm text-zinc-500">Enter the 6-digit verification code</p>
        </div>

        {hasRequest ? (
          <OtpForm />
        ) : (
          <div className="space-y-5 text-center">
            <p className="text-sm text-zinc-400">{GENERIC_RESET_MESSAGE}</p>
            <Link
              href="/admin/forgot"
              className="block text-sm text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Start over
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
