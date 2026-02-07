export default function CustomersLoading() {
  const cols = 3; // Customer, WhatsApp, Actions
  const rows = 10;

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-7 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="mb-4 h-10 max-w-md animate-pulse rounded border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-3 text-left">
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </th>
              <th className="px-4 py-3 text-left">
                <div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </th>
              <th className="px-4 py-3 text-right">
                <div className="ml-auto h-4 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">
                  <div className="h-4 w-40 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="ml-auto h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="flex gap-2">
          <div className="h-9 w-9 animate-pulse rounded border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800" />
          <div className="h-9 w-9 animate-pulse rounded border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
