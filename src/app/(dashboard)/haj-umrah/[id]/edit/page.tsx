import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { notFound } from "next/navigation";
import CreateBookingForm from "../../new/CreateBookingForm";
import { ReceiptIcon } from "../../icons";

function formatTrackNumber(n: number | null): string {
  return n == null ? "—" : n < 1000 ? String(n).padStart(3, "0") : String(n);
}

export default async function EditHajUmrahBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.HAJ_UMRAH_EDIT, { redirectOnForbidden: true });
  const { id } = await params;

  const booking = await prisma.hajUmrahBooking.findUnique({
    where: { id },
    include: { customer: true, campaign: true, packages: true },
  });
  if (!booking) notFound();
  if (booking.canceledAt) {
    return (
      <main className="w-full py-6 sm:py-8">
        <div className="mb-6">
          <Link href={`/haj-umrah/${id}`} className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back to booking
          </Link>
        </div>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          This booking is canceled and cannot be edited.
        </p>
      </main>
    );
  }

  let campaignDateInFuture = true;
  if (booking.campaign) {
    campaignDateInFuture = new Date(booking.campaign.date) > new Date();
  }

  const hasTrackNumber = booking.trackNumber != null;
  let trackNumberDisplay = formatTrackNumber(booking.trackNumber);
  if (!hasTrackNumber) {
    const lastBooking = await prisma.hajUmrahBooking.findFirst({
      where: { trackNumber: { not: null } },
      orderBy: { trackNumber: "desc" },
      select: { trackNumber: true },
    });
    const nextTrackNumber = (lastBooking?.trackNumber ?? 0) + 1;
    trackNumberDisplay = formatTrackNumber(nextTrackNumber);
  }
  const initialBooking = {
    id: booking.id,
    trackNumberDisplay,
    hasNoTrackNumberYet: !hasTrackNumber,
    customerId: booking.customerId,
    campaignId: booking.campaignId,
    status: booking.status,
    notes: booking.notes,
    profit: booking.profit != null ? Number(booking.profit) : 0,
    passportCountry: booking.passportCountry ?? "",
    packages: booking.packages.map((bp) => ({
      packageId: bp.packageId,
      packageName: bp.packageName ?? "Package",
      amount: Number(bp.amount),
    })),
  };

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6">
        <Link href={`/haj-umrah/${id}`} className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to booking
        </Link>
      </div>
      <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-white">
        <span className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
          <ReceiptIcon className="size-5" />
        </span>
        Edit booking {hasTrackNumber ? `#${trackNumberDisplay}` : `(track #${trackNumberDisplay} will be assigned on save)`}
      </h1>
      {!campaignDateInFuture && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          The campaign departure date has passed. This booking can no longer be edited.
        </p>
      )}
      <CreateBookingForm
        nextTrackNumberDisplay={trackNumberDisplay}
        initialBooking={initialBooking}
        allowSaveBeforeCampaignDate={campaignDateInFuture}
      />
    </main>
  );
}
