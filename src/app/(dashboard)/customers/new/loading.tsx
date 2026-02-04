export default function NewCustomerLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 h-6 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        ))}
      </div>
    </div>
  );
}
