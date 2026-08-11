"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { resetPassword } from "@/actions";

export function ResetForm() {
  const [state, formAction, pending] = useActionState(resetPassword, null);
  const [showPassword, setShowPassword] = useState(false);

  const success = state?.success;

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      {success ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-green-900/50 bg-green-950/30 px-4 py-3 text-sm text-green-400">
            Your password has been changed successfully.
          </div>
          <Link
            href="/admin/login"
            className="block rounded-lg bg-white px-4 py-2.5 text-center text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Return to login
          </Link>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-zinc-400">
              New password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              required
              minLength={12}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-zinc-400">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-800"
            />
            Show passwords
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Change password"}
          </button>
        </>
      )}
    </form>
  );
}
