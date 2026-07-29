"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white sm:text-6xl">Error</h1>
        <p className="mt-4 text-lg text-white/60">
          Something went wrong. Please try again.
        </p>
        {error.digest && (
          <p className="mt-2 text-sm text-white/30">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-8 rounded-full border border-white px-8 py-3 text-sm font-medium uppercase tracking-wider text-white transition-all hover:bg-white hover:text-black"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
