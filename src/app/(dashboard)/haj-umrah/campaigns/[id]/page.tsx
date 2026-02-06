import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { notFound } from "next/navigation";
import CampaignDetail from "./CampaignDetail";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.HAJ_UMRAH_VIEW, { redirectOnForbidden: true });
  const canEdit = await (await import("@/lib/permissions")).canAccess(PERMISSION.HAJ_UMRAH_EDIT);
  const { id } = await params;

  const campaign = await prisma.hajUmrahCampaign.findUnique({
    where: { id },
    include: {
      leader: { select: { id: true, name: true, email: true } },
      bookings: {
        include: { customer: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!campaign) notFound();

  // Fetch packages via raw SQL (bypasses Prisma rejecting null packageId)
  const bookingIds = campaign.bookings.map((b) => b.id);
  type PkgRow = { booking_id: string; package_name: string; amount: unknown };
  const packageRows =
    bookingIds.length > 0
      ? await prisma.$queryRaw<PkgRow[]>`
          SELECT booking_id, package_name, amount
          FROM haj_umrah_booking_packages
          WHERE booking_id IN (${Prisma.join(bookingIds)})
        `
      : [];
  const packagesByBooking = new Map<string, { name: string; type: string; amount: number }[]>();
  for (const row of packageRows) {
    const list = packagesByBooking.get(row.booking_id) ?? [];
    list.push({ name: row.package_name ?? "Package", type: "umrah", amount: Number(row.amount) });
    packagesByBooking.set(row.booking_id, list);
  }

  const formatTrack = (n: number | null) =>
    n == null ? "—" : n < 1000 ? String(n).padStart(3, "0") : String(n);

  const serialized = {
    id: campaign.id,
    date: campaign.date.toISOString(),
    returnDate: campaign.returnDate?.toISOString() ?? null,
    month: campaign.month,
    name: campaign.name,
    type: campaign.type,
    leader: campaign.leader ? { id: campaign.leader.id, name: campaign.leader.name, email: campaign.leader.email } : null,
    canceledAt: campaign.canceledAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    bookings: campaign.bookings.map((b) => {
      const packages = packagesByBooking.get(b.id) ?? [];
      return {
        id: b.id,
        trackNumber: b.trackNumber,
        trackNumberDisplay: formatTrack(b.trackNumber),
        customerId: b.customerId,
        customerName: b.customer.name,
        customerPhone: b.customer.phone,
        date: b.date.toISOString(),
        status: b.status,
        canceledAt: b.canceledAt?.toISOString() ?? null,
        packageCount: packages.length,
        totalAmount: packages.reduce((sum, p) => sum + p.amount, 0),
        packages,
      };
    }),
  };

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/haj-umrah/campaigns" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to Campaigns
        </Link>
      </div>
      <CampaignDetail campaign={serialized} canEdit={canEdit} />
    </main>
  );
}
