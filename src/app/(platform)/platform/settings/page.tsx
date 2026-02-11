export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Configure your platform preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
            General Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Platform Name
              </label>
              <input
                type="text"
                defaultValue="Fayo Health Tech"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Support Email
              </label>
              <input
                type="email"
                defaultValue="support@fayohealthtech.so"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Support Phone
              </label>
              <input
                type="tel"
                defaultValue="+252 907 700 949"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Billing Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
            Billing & Payments
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Automatic Billing
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Charge subscriptions automatically
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:border-slate-600 dark:bg-slate-700 dark:peer-focus:ring-emerald-800"></div>
              </label>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  Grace Period
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Days after expiration before suspension
                </p>
              </div>
              <input
                type="number"
                defaultValue="3"
                className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
            Notifications
          </h2>
          <div className="space-y-4">
            {[
              { label: "New Tenant Registration", description: "Get notified when a new tenant signs up" },
              { label: "Payment Received", description: "Notification for successful payments" },
              { label: "Subscription Expiring", description: "Alert 7 days before subscription expires" },
              { label: "Failed Payments", description: "Immediate notification for payment failures" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:border-slate-600 dark:bg-slate-700 dark:peer-focus:ring-emerald-800"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-teal-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
