"use client";

export default function PublicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-black sm:text-6xl text-balance">Error</h1>
        <p className="mt-4 text-lg text-black/60">
          Something went wrong loading this page.
        </p>
        <button
          onClick={reset}
          className="mt-8 rounded-full border border-black px-8 py-3 text-sm font-medium uppercase tracking-wider text-black transition-all hover:bg-black hover:text-white"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
