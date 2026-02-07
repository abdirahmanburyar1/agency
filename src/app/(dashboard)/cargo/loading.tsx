export default function CargoLoading() {
  return (
    <main className="w-full max-w-full py-4 sm:py-6">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-5 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-7 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Filters skeleton */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1 sm:min-w-0">
          <div className="h-10 w-full max-w-xs animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700 sm:w-48" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700 sm:w-52" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700 sm:w-52" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700 sm:w-52" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-32 animate-pulse rounded-xl bg-amber-200/50 dark:bg-amber-900/20" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-20 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead>
            <tr>
              {["Tracking", "Sender", "Receiver", "From", "To", "Carrier", "Weight", "Price", "Status", "Date"].map(
                (label) => (
                  <th key={label} className="px-2 py-3 text-left sm:px-4">
                    <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                {[...Array(10)].map((_, j) => (
                  <td key={j} className="px-2 py-3 sm:px-4">
                    <div
                      className={`h-4 animate-pulse rounded ${j === 0 ? "w-24" : "w-20"} bg-zinc-100 dark:bg-zinc-800`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination skeleton */}
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </main>
  );
}
