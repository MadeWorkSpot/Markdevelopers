"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-black sm:text-2xl">Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
