"use client";

import { useState } from "react";
import { signup } from "@/actions";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirm = form.get("confirmPassword") as string;

    if (password !== confirm) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setPending(false);
      return;
    }

    const result = await signup(form);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/50 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-zinc-400">
          Name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>

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

      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-zinc-400">
          Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          required
          minLength={6}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-zinc-400">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          minLength={6}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-500"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Already have an account?{" "}
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
