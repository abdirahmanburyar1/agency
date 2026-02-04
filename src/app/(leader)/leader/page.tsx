import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PERMISSION } from "@/lib/permissions";
import { isDbConnectionError } from "@/lib/db-safe";
import { CalendarIcon, UsersIcon, ChevronRightIcon } from "@/app/(dashboard)/haj-umrah/icons";

export default async function LeaderCampaignsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  if (!permissions.includes(PERMISSION.HAJ_UMRAH_LEADER)) redirect("/");
  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login");

  let campaigns: Awaited<ReturnType<typeof prisma.hajUmrahCampaign.findMany>> = [];
  try {
    campaigns = await prisma.hajUmrahCampaign.findMany({
      where: { leaderId: userId },
      orderBy: { date: "desc" },
      include: { _count: { select: { bookings: true } } },
    });
  } catch (err) {
    if (isDbConnectionError(err)) {
      return (
        <main className="w-full">
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Database not connected. Please try again later.
          </p>
        </main>
      );
    }
    throw err;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
          My Campaigns
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Campaigns you lead. Tap to view customers and confirm bookings.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <CalendarIcon className="mx-auto size-12 text-zinc-400 dark:text-zinc-500" />
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">No campaigns assigned to you yet.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => {
            const isCanceled = !!c.canceledAt;
            const d = new Date(c.date);
            const dateStr = d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
            return (
              <li key={c.id}>
                <Link
                  href={`/leader/campaigns/${c.id}`}
                  className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-teal-600"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {dateStr} · {timeStr}
                      </p>
                      {c.name && (
                        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{c.name}</p>
                      )}
                      {c.type && (
                        <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium capitalize text-teal-800 dark:bg-teal-900/40 dark:text-teal-400">
                          {c.type}
                        </span>
                      )}
                    </div>
                    <ChevronRightIcon className="size-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <UsersIcon className="size-4" />
                    <span>{c._count.bookings} customers</span>
                    {isCanceled && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-400">
                        Canceled
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
