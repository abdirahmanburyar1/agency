export default function SubscriptionExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
          Subscription Expired
        </h1>
        <p className="mb-6 text-center text-slate-600 dark:text-slate-400">
          Your subscription has expired or is no longer active. Please contact support to renew your subscription.
        </p>

        <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Contact Support:
          </p>
          <a
            href="tel:+252907700949"
            className="flex items-center gap-2 text-lg font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            +252 907 700 949
          </a>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
