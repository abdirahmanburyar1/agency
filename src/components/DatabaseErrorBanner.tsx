export default function DatabaseErrorBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800/50 dark:bg-amber-950/30">
      <h3 className="font-semibold text-amber-800 dark:text-amber-200">Database not connected</h3>
      <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
        Start PostgreSQL with{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 dark:bg-amber-900/50">
          docker-compose up -d
        </code>{" "}
        from the project root, then run{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 dark:bg-amber-900/50">
          npm run db:push
        </code>
        .
      </p>
    </div>
  );
}
