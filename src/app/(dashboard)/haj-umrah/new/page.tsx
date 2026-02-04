import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CreateBookingForm from "./CreateBookingForm";
import { ReceiptIcon } from "../icons";

function formatTrackNumber(n: number): string {
  return n < 1000 ? String(n).padStart(3, "0") : String(n);
}

type Props = { searchParams: Promise<{ customerId?: string }> };

export default async function NewHajUmrahBookingPage({ searchParams }: Props) {
  await requirePermission(PERMISSION.HAJ_UMRAH_CREATE, { redirectOnForbidden: true });

  const params = await searchParams;
  const initialCustomerId = typeof params.customerId === "string" && params.customerId.trim() ? params.customerId.trim() : undefined;

  const lastBooking = await prisma.hajUmrahBooking.findFirst({
    where: { trackNumber: { not: null } },
    orderBy: { trackNumber: "desc" },
    select: { trackNumber: true },
  });
  const nextTrackNumber = (lastBooking?.trackNumber ?? 0) + 1;
  const nextTrackNumberDisplay = formatTrackNumber(nextTrackNumber);

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6">
        <Link href="/haj-umrah" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back to Haj & Umrah
        </Link>
      </div>
      <h1 className="mb-6 flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-white">
        <span className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
          <ReceiptIcon className="size-5" />
        </span>
        New Haj & Umrah Booking
      </h1>
      <CreateBookingForm nextTrackNumberDisplay={nextTrackNumberDisplay} initialCustomerId={initialCustomerId} />
    </main>
  );
}
