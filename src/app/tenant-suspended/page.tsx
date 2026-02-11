export default function TenantSuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
          Account Suspended
        </h1>
        <p className="mb-6 text-center text-slate-600 dark:text-slate-400">
          This organization's account has been suspended. Access to all services has been temporarily disabled.
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
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Please contact support to resolve this issue and restore access to your account.
          </p>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/login";
            }}
          >
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
