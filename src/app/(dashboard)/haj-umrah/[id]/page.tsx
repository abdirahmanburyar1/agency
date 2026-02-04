import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { notFound } from "next/navigation";
import HajUmrahBookingDetail from "./HajUmrahBookingDetail";

export default async function HajUmrahBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.HAJ_UMRAH_VIEW, { redirectOnForbidden: true });
  const canEdit = await (await import("@/lib/permissions")).canAccess(PERMISSION.HAJ_UMRAH_EDIT);
  const { id } = await params;

  const booking = await prisma.hajUmrahBooking.findUnique({
    where: { id },
    include: {
      customer: true,
      campaign: { include: { leader: { select: { id: true, name: true, email: true } } } },
      packages: { include: { package: true } },
      payments: { where: { canceledAt: null }, orderBy: { date: "desc" } },
    },
  });
  if (!booking) notFound();

  const totalAmount = booking.packages.reduce((sum, bp) => sum + Number(bp.amount), 0);
  const trackNumberDisplay =
    booking.trackNumber != null
      ? booking.trackNumber < 1000
        ? String(booking.trackNumber).padStart(3, "0")
        : String(booking.trackNumber)
      : "—";
  const campaignDisplay = booking.campaign
    ? (() => {
        const d = new Date(booking.campaign.date);
        const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
        const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
        let s = `${dateStr} ${timeStr}`;
        if (booking.campaign.name) s += ` — ${booking.campaign.name}`;
        const leader = booking.campaign.leader;
        if (leader) s += ` · ${leader.name?.trim() || leader.email}`;
        if (booking.campaign.type) s += ` (${booking.campaign.type})`;
        return s;
      })()
    : null;
  const serialized = {
    id: booking.id,
    trackNumber: booking.trackNumber,
    trackNumberDisplay,
    campaignId: booking.campaignId,
    campaign: booking.campaign
      ? {
          id: booking.campaign.id,
          date: booking.campaign.date.toISOString(),
          month: booking.campaign.month,
          name: booking.campaign.name,
          type: booking.campaign.type,
          leader: booking.campaign.leader ? { id: booking.campaign.leader.id, name: booking.campaign.leader.name, email: booking.campaign.leader.email } : null,
        }
      : null,
    campaignDisplay,
    customerId: booking.customerId,
    customer: {
      id: booking.customer.id,
      name: booking.customer.name,
      email: booking.customer.email,
      phone: booking.customer.phone,
    },
    date: booking.date.toISOString(),
    month: booking.month,
    status: booking.status,
    notes: booking.notes,
    createdAt: booking.createdAt.toISOString(),
    canceledAt: booking.canceledAt?.toISOString() ?? null,
    packages: booking.packages.map((bp) => ({
      id: bp.id,
      packageId: bp.packageId,
      packageName: bp.package.name,
      packageType: bp.package.type,
      quantity: bp.quantity,
      unitPrice: Number(bp.unitPrice),
      amount: Number(bp.amount),
    })),
    totalAmount,
  };

  let campaignDateInFuture = true;
  if (booking.campaign) {
    campaignDateInFuture = new Date(booking.campaign.date) > new Date();
  }
  const canEditBooking = canEdit && !booking.canceledAt && campaignDateInFuture;
  const showEditAction = canEditBooking;

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/haj-umrah" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to Haj & Umrah
        </Link>
        {showEditAction && (
          <Link
            href={`/haj-umrah/${id}/edit`}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            Edit booking
          </Link>
        )}
      </div>
      <HajUmrahBookingDetail booking={serialized} canEdit={canEdit} />
    </main>
  );
}
