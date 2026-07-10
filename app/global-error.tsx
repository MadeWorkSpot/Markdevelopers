"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-medium">Something went wrong</h2>
          <p className="mt-2 text-zinc-400">{error.message || "An unexpected error occurred."}</p>
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
