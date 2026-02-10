const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "fayohealthtech.so";
const LOGIN_URL = `https://${ROOT_DOMAIN}/login`;

export default function TenantSuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <svg
            className="size-8 text-amber-600 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Organization Unavailable</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          This organization has been suspended. Please contact support if you believe this is an error.
        </p>
        <a
          href={LOGIN_URL}
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Back to Login
        </a>
      </div>
    </div>
  );
}
