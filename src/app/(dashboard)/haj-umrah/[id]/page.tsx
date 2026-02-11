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

  const session = await (await import("@/auth")).auth();
  const tenantId = (await import("@/lib/tenant")).getTenantIdFromSession(session);

  const booking = await prisma.hajUmrahBooking.findFirst({
    where: { 
      id,
      tenantId, // SCOPE BY TENANT - security check
    },
    include: {
      customer: true,
      campaign: { include: { leader: { select: { id: true, name: true, email: true } } } },
      payments: {
        orderBy: { date: "desc" },
        include: { receipts: { select: { amount: true } } },
      },
    },
  });
  if (!booking) notFound();

  // Fetch packages via raw SQL (bypasses Prisma rejecting null packageId)
  type PkgRow = { id: string; booking_id: string; package_id: string | null; package_name: string; quantity: unknown; unit_price: unknown; amount: unknown };
  const packageRows = await prisma.$queryRaw<PkgRow[]>`
    SELECT id, booking_id, package_id, package_name, quantity, unit_price, amount
    FROM haj_umrah_booking_packages
    WHERE booking_id = ${id}
  `;
  const packages = packageRows.map((row) => ({
    id: row.id,
    packageId: row.package_id,
    packageName: row.package_name ?? "Package",
    packageType: "umrah" as const,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    amount: Number(row.amount),
  }));

  const packagesTotal = packages.reduce((sum, bp) => sum + bp.amount, 0);
  const profitAmount = booking.profit != null ? Number(booking.profit) : 0;
  const totalAmount = packagesTotal + profitAmount;
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
      phone: booking.customer.phone,
      whatsappNumber: booking.customer.whatsappNumber,
    },
    date: booking.date.toISOString(),
    month: booking.month,
    status: booking.status,
    notes: booking.notes,
    profit: booking.profit != null ? Number(booking.profit) : null,
    passportCountry: booking.passportCountry ?? null,
    createdAt: booking.createdAt.toISOString(),
    canceledAt: booking.canceledAt?.toISOString() ?? null,
    payments: booking.payments.map((p) => {
      const amountReceived = p.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
      return {
        id: p.id,
        date: p.date.toISOString(),
        amount: Number(p.amount),
        status: p.status,
        canceledAt: p.canceledAt?.toISOString() ?? null,
        amountReceived,
      };
    }),
    totalReceived: booking.payments.reduce((sum, p) => {
      return sum + p.receipts.reduce((s, r) => s + Number(r.amount), 0);
    }, 0),
    packages,
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
