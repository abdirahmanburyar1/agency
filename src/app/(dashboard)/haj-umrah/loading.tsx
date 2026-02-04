export default function Loading() {
  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-10 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
    </main>
  );
}
