import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CreateCampaignForm from "./CreateCampaignForm";
import { CalendarIcon } from "../../icons";

export default async function NewCampaignPage() {
  await requirePermission(PERMISSION.HAJ_UMRAH_CREATE, { redirectOnForbidden: true });

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/haj-umrah/campaigns" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to Campaigns
        </Link>
      </div>
      <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-white">
        <span className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
          <CalendarIcon className="size-5" />
        </span>
        New Campaign
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Set the departure date for this campaign (e.g. 10/02/2026). You can have multiple campaigns per month.
      </p>
      <CreateCampaignForm users={users} />
    </main>
  );
}
