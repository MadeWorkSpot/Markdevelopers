export default function Loading() {
  return (
    <section className="relative flex min-h-dvh items-center bg-black px-4 md:px-8 lg:px-12 xl:px-24 pt-24">
      <div className="absolute inset-0 bg-white/[0.03] animate-shimmer" />
      <div className="relative z-10 max-w-4xl space-y-6">
        <div className="h-4 w-32 rounded bg-white/10 animate-shimmer" />
        <div className="h-16 w-full max-w-2xl rounded bg-white/10 animate-shimmer" />
        <div className="h-4 w-96 rounded bg-white/5 animate-shimmer" />
        <div className="h-4 w-80 rounded bg-white/5 animate-shimmer" />
        <div className="h-4 w-64 rounded bg-white/5 animate-shimmer" />
        <div className="h-12 w-44 rounded-full bg-white/10 animate-shimmer" />
      </div>
    </section>
  );
}
