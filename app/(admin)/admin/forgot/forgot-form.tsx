"use client";

import { useState, useEffect, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestPasswordReset } from "@/actions";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      router.push("/admin/forgot/otp");
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-lg border border-green-900/50 bg-green-950/30 px-4 py-3 text-sm text-green-400">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-400">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send verification code"}
      </button>

      <Link
        href="/admin/login"
        className="block text-center text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        Back to login
      </Link>
    </form>
  );
}
