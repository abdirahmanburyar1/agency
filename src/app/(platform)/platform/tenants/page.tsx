import { prisma } from "@/lib/db";
import TenantActions from "./TenantActions";
import CreateTenantForm from "./CreateTenantForm";

export default async function PlatformTenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tenants</h1>
        <CreateTenantForm />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Subdomain
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Users
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {tenants.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 font-mono text-sm">
                  <a
                    href={`https://${t.subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "fayohealthtech.so"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    {t.subdomain}
                  </a>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{t.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.status === "active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : t.status === "suspended"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  {t._count.users}
                </td>
                <td className="px-4 py-3 text-right">
                  <TenantActions tenant={t} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
            No tenants yet. Create one above.
          </p>
        )}
      </div>
    </div>
  );
}
