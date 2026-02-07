export default function CargoDetailLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 h-6 w-32 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-48 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </main>
  );
}
