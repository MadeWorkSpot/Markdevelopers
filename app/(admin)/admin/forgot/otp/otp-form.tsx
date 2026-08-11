"use client";

import { useEffect, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyOtp, resendOtp } from "@/actions";

export function OtpForm() {
  const [state, formAction, pending] = useActionState(verifyOtp, null);
  const [resendState, resendAction, resendPending] = useActionState(resendOtp, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/admin/forgot/reset");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {resendState?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {resendState.error}
        </div>
      )}
      {resendState?.success && (
        <div className="rounded-lg border border-green-900/50 bg-green-950/30 px-4 py-3 text-sm text-green-400">
          A new code has been sent.
        </div>
      )}

      <div>
        <label htmlFor="otp" className="mb-1.5 block text-xs font-medium text-zinc-400">
          Verification code
        </label>
        <input
          id="otp"
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-center text-2xl tracking-[0.5em] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? "Verifying..." : "Verify"}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => resendAction()}
          disabled={resendPending}
          className="text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-50"
        >
          {resendPending ? "Sending..." : "Resend code"}
        </button>
        <Link href="/admin/forgot" className="text-zinc-400 transition-colors hover:text-zinc-200">
          Start over
        </Link>
      </div>
    </form>
  );
}
