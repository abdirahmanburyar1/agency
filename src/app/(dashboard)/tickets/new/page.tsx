import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import CreateTicketForm from "./CreateTicketForm";

export default async function NewTicketPage() {
  await requirePermission(PERMISSION.TICKETS_CREATE, { redirectOnForbidden: true });
  const session = await auth();
  const sponsorName = session?.user?.name?.trim() || session?.user?.email || "";

  const lastTicket = await prisma.ticket.findFirst({
    where: { ticketNumber: { not: null } },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  const nextTicketNumber = (lastTicket?.ticketNumber ?? 0) + 1;
  const nextTicketNoDisplay =
    nextTicketNumber < 1000
      ? String(nextTicketNumber).padStart(3, "0")
      : String(nextTicketNumber);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/tickets"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Back to Tickets
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Create Ticket
        </h1>
      </div>
      <CreateTicketForm sponsorName={sponsorName} nextTicketNo={nextTicketNoDisplay} />
    </main>
  );
}
