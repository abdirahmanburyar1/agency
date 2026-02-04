export default function AdminLoading() {
  return (
    <div className="w-full">
      <div className="mb-6 h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
    </div>
  );
}
