import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PERMISSION } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { isDbConnectionError } from "@/lib/db-safe";
import CampaignDetail from "@/app/(dashboard)/haj-umrah/campaigns/[id]/CampaignDetail";

export default async function LeaderCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) notFound();
  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  if (!permissions.includes(PERMISSION.HAJ_UMRAH_LEADER)) notFound();
  const userId = (session.user as { id?: string }).id;
  if (!userId) notFound();

  const { id } = await params;
  const campaignQuery = () =>
    prisma.hajUmrahCampaign.findFirst({
      where: { id, leaderId: userId },
      include: {
        leader: { select: { id: true, name: true, email: true } },
        bookings: {
          include: { customer: true, packages: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  let campaign: Awaited<ReturnType<typeof campaignQuery>> = null;
  try {
    campaign = await campaignQuery();
  } catch (err) {
    if (isDbConnectionError(err)) {
      return (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          Database not connected. Please try again later.
        </div>
      );
    }
    throw err;
  }
  if (!campaign) notFound();

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
    bookings: campaign.bookings
      .filter((b) => b.status === "confirmed" && !b.canceledAt)
      .map((b) => ({
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
        name: bp.packageName ?? "Package",
        type: "umrah",
        quantity: bp.quantity,
        unitPrice: Number(bp.unitPrice),
        amount: Number(bp.amount),
      })),
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/leader"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          aria-label="Back to My Campaigns"
        >
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">My Campaigns</span>
      </div>
      <CampaignDetail campaign={serialized} canEdit={true} leaderView={true} />
    </div>
  );
}
