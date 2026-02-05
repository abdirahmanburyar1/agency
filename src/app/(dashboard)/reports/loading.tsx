export default function ReportsLoading() {
  return (
    <div className="space-y-8">
      {/* Filters skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 sm:p-6">
        <div className="mb-4 h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <div className="w-full min-w-0 sm:w-36">
            <div className="mb-1 h-3 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="w-full min-w-0 sm:w-36">
            <div className="mb-1 h-3 w-8 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="w-full min-w-0 sm:w-40">
            <div className="mb-1 h-3 w-14 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 sm:w-24" />
        </div>
        <div className="mt-3 h-3 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Summary skeleton */}
      <section>
        <div className="mb-4 h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-8 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </section>

      {/* Chart skeleton */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="mb-4 h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-80 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="flex gap-2">
            <div className="h-9 w-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                {Array.from({ length: 7 }).map((_, i) => (
                  <th key={i} className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" style={{ width: i === 0 ? 60 : 70 }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-3 py-3 sm:px-6 sm:py-4">
                      <div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" style={{ width: j === 0 ? 50 : 60 }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
