"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { forgotPassword } from "@/actions";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(forgotPassword, null);

  useEffect(() => {
    if (state?.success && state?.email) {
      router.push(`/admin/reset-password?email=${encodeURIComponent(state.email)}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/50 p-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-400">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Sending code..." : "Send Reset Code"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Remember your password?{" "}
        <button
          type="button"
          onClick={() => router.push("/admin/login")}
          className="text-zinc-300 underline transition-colors hover:text-white"
        >
          Log in
        </button>
      </p>
    </form>
  );
}
