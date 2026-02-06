import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { isDbConnectionError } from "@/lib/db-safe";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import { PackageIcon, PlusIcon, PencilIcon } from "../icons";
import PackageDeleteButton from "./PackageDeleteButton";

export default async function HajUmrahPackagesPage() {
  await requirePermission(PERMISSION.HAJ_UMRAH_VIEW, { redirectOnForbidden: true });
  const canEdit = await (await import("@/lib/permissions")).canAccess(PERMISSION.HAJ_UMRAH_EDIT);
  const canDelete = await (await import("@/lib/permissions")).canAccess(PERMISSION.HAJ_UMRAH_DELETE);
  const canCreate = await (await import("@/lib/permissions")).canAccess(PERMISSION.HAJ_UMRAH_CREATE);

  type PackageRow = {
    id: string;
    name: string;
    type: string;
    description: string | null;
    duration_days: number | null;
    is_active: boolean;
    price_by_country: boolean;
    fixed_price: unknown;
  };
  type VisaPriceRow = { package_id: string; country: string; price: unknown };
  let packages: (PackageRow & { visaPrices: { country: string; price: number }[]; fixedPrice: number | null; priceByCountry: boolean; durationDays: number | null; isActive: boolean })[] = [];
  try {
    const pkgRows = await prisma.$queryRaw<PackageRow[]>`
      SELECT id, name, type, description, duration_days, is_active, price_by_country, fixed_price
      FROM haj_umrah_packages
      ORDER BY type ASC, name ASC
    `;
    const visaRows = await prisma.$queryRaw<VisaPriceRow[]>`
      SELECT package_id, country, price FROM haj_umrah_package_visa_prices
    `;
    packages = pkgRows.map((p) => ({
      ...p,
      durationDays: p.duration_days,
      isActive: p.is_active,
      priceByCountry: p.price_by_country,
      fixedPrice: p.fixed_price != null ? Number(p.fixed_price) : null,
      visaPrices: visaRows
        .filter((v) => v.package_id === p.id)
        .map((v) => ({ country: v.country, price: Number(v.price) })),
    }));
  } catch (err) {
    if (isDbConnectionError(err)) {
      return (
        <main className="w-full py-6 sm:py-8">
          <div className="mb-6">
            <Link href="/haj-umrah" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              ← Back to Haj & Umrah
            </Link>
          </div>
          <DatabaseErrorBanner />
        </main>
      );
    }
    throw err;
  }

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/haj-umrah" className="shrink-0 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back to Haj & Umrah
          </Link>
          <h1 className="flex items-center gap-2 truncate text-xl font-semibold text-zinc-900 dark:text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
              <PackageIcon className="size-5" />
            </span>
            Haj & Umrah Packages
          </h1>
        </div>
        {canCreate && (
          <Link
            href="/haj-umrah/packages/new"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
          >
            <PlusIcon />
            Add Package
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Type</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Description</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  Price
                  <span className="block text-xs font-normal text-zinc-500 dark:text-zinc-400">by country or fixed</span>
                </th>
                <th className="px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300">Duration</th>
                <th className="px-4 py-3 text-center font-medium text-zinc-700 dark:text-zinc-300">Active</th>
                {(canEdit || canDelete) && (
                  <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={canEdit || canDelete ? 7 : 6} className="px-4 py-8 text-center text-zinc-500">
                    No packages yet. Add a package to use in bookings.
                  </td>
                </tr>
              ) : (
                packages.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">{p.type}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-zinc-600 dark:text-zinc-400" title={p.description ?? undefined}>
                      {p.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {p.priceByCountry && p.visaPrices?.length ? (
                        <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                          {p.visaPrices.map((v) => (
                            <li key={v.country} className="flex justify-between gap-4 py-1 text-sm first:pt-0 last:pb-0">
                              <span>{v.country}</span>
                              <span className="font-medium tabular-nums">${Number(v.price).toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      ) : p.fixedPrice != null ? (
                        <span>
                          <span className="font-medium tabular-nums">${Number(p.fixedPrice).toLocaleString()}</span>
                          <span className="ml-1 text-xs text-zinc-500">(fixed)</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">
                      {p.durationDays != null ? `${p.durationDays} days` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {p.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {canEdit && (
                            <Link
                              href={`/haj-umrah/packages/${p.id}/edit`}
                              className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            >
                              <PencilIcon className="size-4" />
                              Edit
                            </Link>
                          )}
                          {canDelete && (
                            <PackageDeleteButton packageId={p.id} packageName={p.name} />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
