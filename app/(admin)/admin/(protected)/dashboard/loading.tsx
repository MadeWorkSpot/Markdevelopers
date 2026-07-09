export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-7 w-40 rounded bg-white/5" />
        <div className="mt-2 h-4 w-64 rounded bg-white/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className="h-3 w-24 rounded bg-white/5" />
            <div className="mt-3 h-8 w-12 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
