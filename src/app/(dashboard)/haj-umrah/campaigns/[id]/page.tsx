import Link from "next/link";
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
        include: { customer: true, packages: { include: { package: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!campaign) notFound();

  const formatTrack = (n: number | null) =>
    n == null ? "—" : n < 1000 ? String(n).padStart(3, "0") : String(n);

  const serialized = {
    id: campaign.id,
    date: campaign.date.toISOString(),
    month: campaign.month,
    name: campaign.name,
    type: campaign.type,
    leader: campaign.leader ? { id: campaign.leader.id, name: campaign.leader.name, email: campaign.leader.email } : null,
    canceledAt: campaign.canceledAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    bookings: campaign.bookings.map((b) => ({
      id: b.id,
      trackNumber: b.trackNumber,
      trackNumberDisplay: formatTrack(b.trackNumber),
      customerId: b.customerId,
      customerName: b.customer.name,
      customerPhone: b.customer.phone,
      date: b.date.toISOString(),
      status: b.status,
      canceledAt: b.canceledAt?.toISOString() ?? null,
      packageCount: b.packages.reduce((s, bp) => s + bp.quantity, 0),
      totalAmount: b.packages.reduce((sum, bp) => sum + Number(bp.amount), 0),
      packages: b.packages.map((bp) => ({
        name: bp.package.name,
        type: bp.package.type,
        quantity: bp.quantity,
        unitPrice: Number(bp.unitPrice),
        amount: Number(bp.amount),
      })),
    })),
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
