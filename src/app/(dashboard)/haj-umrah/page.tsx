import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { isDbConnectionError } from "@/lib/db-safe";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import HajUmrahBookingsTable from "./HajUmrahBookingsTable";
import { HajUmrahIcon, CalendarIcon, PackageIcon, PlusIcon } from "./icons";

export default async function HajUmrahPage({
  searchParams,
}: {
  searchParams: Promise<{ campaign?: string }>;
}) {
  await requirePermission(PERMISSION.HAJ_UMRAH_VIEW, { redirectOnForbidden: true });
  const { campaign: campaignIdFromUrl } = await searchParams;
  const [canCreate, canEdit] = await Promise.all([
    (await import("@/lib/permissions")).canAccess(PERMISSION.HAJ_UMRAH_CREATE),
    (await import("@/lib/permissions")).canAccess(PERMISSION.HAJ_UMRAH_EDIT),
  ]);

  // Fetch bookings WITHOUT packages to avoid Prisma rejecting null packageId (deleted packages)
  const bookingsQuery = () =>
    prisma.hajUmrahBooking.findMany({
      orderBy: { createdAt: "desc" },
      include: { customer: true, campaign: { include: { leader: true } } },
    });
  let bookings: (Awaited<ReturnType<typeof bookingsQuery>>[number] & {
    packages: { packageName: string; amount: number }[];
  })[] = [];
  try {
    const rawBookings = await bookingsQuery();
    // Fetch packages via raw SQL (bypasses Prisma validation of nullable packageId)
    const bookingIds = rawBookings.map((b) => b.id);
    type PkgRow = { booking_id: string; package_name: string; amount: unknown };
    const packageRows =
      bookingIds.length > 0
        ? await prisma.$queryRaw<PkgRow[]>`
            SELECT booking_id, package_name, amount
            FROM haj_umrah_booking_packages
            WHERE booking_id IN (${Prisma.join(bookingIds)})
          `
        : [];
    const packagesByBooking = new Map<string, { packageName: string; amount: number }[]>();
    for (const row of packageRows) {
      const list = packagesByBooking.get(row.booking_id) ?? [];
      list.push({ packageName: row.package_name ?? "Package", amount: Number(row.amount) });
      packagesByBooking.set(row.booking_id, list);
    }
    bookings = rawBookings.map((b) => ({
      ...b,
      packages: (packagesByBooking.get(b.id) ?? []).map((p) => ({
        packageName: p.packageName,
        amount: p.amount,
      })),
    }));
  } catch (err) {
    if (isDbConnectionError(err)) {
      return (
        <main className="w-full py-6 sm:py-8">
          <div className="mb-6">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              ← Back
            </Link>
          </div>
          <DatabaseErrorBanner />
        </main>
      );
    }
    throw err;
  }

  const formatTrackNumber = (n: number | null) =>
    n == null ? "—" : n < 1000 ? String(n).padStart(3, "0") : String(n);

  const serialized = bookings.map((b) => {
    const packageSummary = b.packages.map((bp) => bp.packageName ?? "Package").join(", ");
    const packageCount = b.packages.length;
    const campaignDisplay = b.campaign
      ? (() => {
          const d = new Date(b.campaign.date);
          const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
          const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
          let s = `${dateStr} ${timeStr}`;
          if (b.campaign.name) s += ` ${b.campaign.name}`;
          if (b.campaign.leader) s += ` · ${b.campaign.leader.name?.trim() || b.campaign.leader.email}`;
          return s;
        })()
      : "—";
    return {
      id: b.id,
      trackNumber: b.trackNumber,
      trackNumberDisplay: formatTrackNumber(b.trackNumber),
      campaignId: b.campaignId,
      campaignDisplay,
      customerId: b.customerId,
      customerName: b.customer.name,
      customerPhone: b.customer.phone,
      date: b.date.toISOString(),
      month: b.month,
      status: b.status,
      notes: b.notes,
      packageCount,
      packageSummary,
      totalAmount: b.packages.reduce((sum, bp) => sum + Number(bp.amount), 0),
      canceledAt: b.canceledAt?.toISOString() ?? null,
    };
  });

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <span className="size-4" aria-hidden>←</span>
            Back
          </Link>
          <h1 className="flex items-center gap-2 truncate text-xl font-semibold text-zinc-900 dark:text-white">
            <span className="flex size-8 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
              <HajUmrahIcon className="size-5" />
            </span>
            Haj & Umrah
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/haj-umrah/campaigns"
            className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <CalendarIcon />
            Campaigns
          </Link>
          <Link
            href="/haj-umrah/packages"
            className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <PackageIcon />
            Packages
          </Link>
          {canCreate && (
            <Link
              href="/haj-umrah/new"
              className="flex shrink-0 items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            >
              <PlusIcon />
              New Booking
            </Link>
          )}
        </div>
      </div>

      <HajUmrahBookingsTable bookings={serialized} canEdit={canEdit} initialCampaignId={campaignIdFromUrl ?? undefined} />
    </main>
  );
}
