import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { isDbConnectionError } from "@/lib/db-safe";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import { notFound } from "next/navigation";
import EditCampaignForm from "../EditCampaignForm";
import { CalendarIcon } from "../../../icons";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.HAJ_UMRAH_EDIT, { redirectOnForbidden: true });
  const { id } = await params;

  let campaign: Awaited<ReturnType<typeof prisma.hajUmrahCampaign.findUnique>> = null;
  try {
    campaign = await prisma.hajUmrahCampaign.findUnique({
      where: { id },
      include: { leader: { select: { id: true, name: true, email: true } } },
    });
  } catch (err) {
    if (isDbConnectionError(err)) {
      return (
        <main className="w-full py-6 sm:py-8">
          <div className="mb-6">
            <Link href="/haj-umrah/campaigns" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              ← Back to Campaigns
            </Link>
          </div>
          <DatabaseErrorBanner />
        </main>
      );
    }
    throw err;
  }
  if (!campaign) notFound();
  if (campaign.canceledAt) {
    return (
      <main className="w-full py-6 sm:py-8">
        <div className="mb-6">
          <Link href={`/haj-umrah/campaigns/${id}`} className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back to Campaign
          </Link>
        </div>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          This campaign is canceled and cannot be edited.
        </p>
      </main>
    );
  }
  const campaignDateInFuture = new Date(campaign.date) > new Date();
  if (!campaignDateInFuture) {
    return (
      <main className="w-full py-6 sm:py-8">
        <div className="mb-6">
          <Link href={`/haj-umrah/campaigns/${id}`} className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back to Campaign
          </Link>
        </div>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          This campaign&apos;s departure date and time have passed. It can no longer be edited.
        </p>
      </main>
    );
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  const d = new Date(campaign.date);
  const initialCampaign = {
    id: campaign.id,
    date: d.toISOString().slice(0, 10),
    time: d.toTimeString().slice(0, 5),
    name: campaign.name ?? "",
    type: (campaign.type as "haj" | "umrah") ?? "",
    leaderId: campaign.leaderId ?? "",
  };

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6">
        <Link href={`/haj-umrah/campaigns/${id}`} className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to Campaign
        </Link>
      </div>
      <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-white">
        <span className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
          <CalendarIcon className="size-5" />
        </span>
        Edit Campaign
      </h1>
      <EditCampaignForm campaignId={id} initial={initialCampaign} users={users} />
    </main>
  );
}
