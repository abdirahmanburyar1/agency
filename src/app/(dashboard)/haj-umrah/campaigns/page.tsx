import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { isDbConnectionError } from "@/lib/db-safe";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import { CalendarIcon, PlusIcon, EyeIcon, UsersIcon } from "../icons";
import { auth } from "@/auth";
import { getTenantIdFromSession } from "@/lib/tenant";

export default async function HajUmrahCampaignsPage() {
  await requirePermission(PERMISSION.HAJ_UMRAH_VIEW, { redirectOnForbidden: true });
  const canCreate = await (await import("@/lib/permissions")).canAccess(PERMISSION.HAJ_UMRAH_CREATE);

  const session = await auth();
  const tenantId = getTenantIdFromSession(session);

  const campaignsQuery = () =>
    prisma.hajUmrahCampaign.findMany({
      where: { tenantId }, // SCOPE BY TENANT
      orderBy: { date: "desc" },
      include: {
        _count: { select: { bookings: true } },
        leader: { select: { id: true, name: true, email: true } },
      },
    });
  let campaigns: Awaited<ReturnType<typeof campaignsQuery>> = [];
  try {
    campaigns = await campaignsQuery();
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
              <CalendarIcon className="size-5" />
            </span>
            Campaigns
          </h1>
        </div>
        {canCreate && (
          <Link
            href="/haj-umrah/campaigns/new"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
          >
            <PlusIcon />
            New Campaign
          </Link>
        )}
      </div>

      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Campaigns are departure dates (e.g. 10/02/2026, 24/02/2026). You can have multiple campaigns per month. Each campaign can contain one or more customers (bookings).
      </p>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Departure date & time</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Leader</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Type</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Status</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="inline-flex items-center justify-end gap-1.5">
                    <UsersIcon className="size-4" />
                    Customers
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No campaigns yet. Create a campaign to attach bookings to a departure date.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const isCanceled = !!c.canceledAt;
                  const isPastDue = new Date(c.date) <= new Date();
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                        {new Date(c.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}{" "}
                        {new Date(c.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.name || "—"}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{c.leader ? (c.leader.name?.trim() || c.leader.email) : "—"}</td>
                      <td className="px-4 py-3 capitalize text-zinc-600 dark:text-zinc-400">{c.type || "—"}</td>
                      <td className="px-4 py-3">
                        {isCanceled ? (
                          <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-400">
                            Canceled
                          </span>
                        ) : isPastDue ? (
                          <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                            Past
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
                            Upcoming
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                        {c._count.bookings}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/haj-umrah/campaigns/${c.id}`}
                          className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                          <EyeIcon className="size-4" />
                          View / Manage
                        </Link>
                        {" · "}
                        <Link
                          href={`/haj-umrah?campaign=${c.id}`}
                          className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                          Bookings list
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
