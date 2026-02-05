export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-zinc-950">
      <img
        src="/logo.png"
        alt=""
        className="h-14 w-auto max-w-[180px] object-contain opacity-90"
      />
      <div
        className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-label="Loading"
      >
        <div
          className="h-full w-1/2 rounded-full bg-emerald-500 dark:bg-emerald-400"
          style={{ animation: "global-loading 1.2s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
