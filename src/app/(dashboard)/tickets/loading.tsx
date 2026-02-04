export default function TicketsLoading() {
  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-5 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-6 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* Filters skeleton */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 h-3 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-full min-w-[200px] animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div>
            <div className="mb-1 h-3 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div>
            <div className="mb-1 h-3 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          </div>
          <div>
            <div className="mb-1 h-3 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-10 w-36 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex gap-4 px-4 py-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 flex-1 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"
                style={{ maxWidth: i === 0 ? 80 : undefined }}
              />
            ))}
          </div>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3">
              {Array.from({ length: 8 }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 flex-1 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
                  style={{
                    maxWidth: j === 0 ? 60 : j === 2 ? 90 : undefined,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
