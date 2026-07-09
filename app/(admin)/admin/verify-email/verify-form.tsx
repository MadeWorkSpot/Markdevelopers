"use client";

import { useState } from "react";
import { verifyOtp, resendOtp } from "@/actions";

export function VerifyForm({ email }: { email: string }) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    form.set("email", email);

    const result = await verifyOtp(form);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setMessage(null);
    const result = await resendOtp(email);
    if (result?.error) {
      setError(result.error);
    } else {
      setMessage("A new code has been sent to your email.");
    }
    setResending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/50 p-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-green-900/50 bg-green-950/50 p-3 text-sm text-green-400">
          {message}
        </p>
      )}

      <div>
        <p className="text-sm text-zinc-400">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-white">{email}</span>
        </p>
      </div>

      <div>
        <label htmlFor="code" className="mb-1.5 block text-xs font-medium text-zinc-400">
          Verification Code
        </label>
        <input
          id="code"
          type="text"
          name="code"
          inputMode="numeric"
          maxLength={6}
          required
          placeholder="000000"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-center text-2xl tracking-[0.5em] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Verifying..." : "Verify Email"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Did not receive the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-zinc-300 underline transition-colors hover:text-white disabled:opacity-50"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </p>
    </form>
  );
}
