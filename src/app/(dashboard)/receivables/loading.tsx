export default function ReceivablesLoading() {
  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-5 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="mb-4 h-4 w-96 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              {Array.from({ length: 9 }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 flex-1 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
