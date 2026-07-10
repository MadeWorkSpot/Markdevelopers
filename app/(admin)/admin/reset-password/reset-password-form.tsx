"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword, resendOtp } from "@/actions";

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(resetPassword, null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.success) {
      router.push("/admin/login");
    }
  }, [state, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirmPassword") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    formAction(form);
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
      <input type="hidden" name="email" value={email} />

      {(state?.error || error) && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/50 p-3 text-sm text-red-400">
          {state?.error || error}
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

      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-zinc-400">
          New Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 pr-10 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-zinc-400">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          required
          minLength={6}
          placeholder="Re-enter password"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Resetting..." : "Reset Password"}
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
