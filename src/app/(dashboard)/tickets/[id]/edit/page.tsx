import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import EditTicketForm from "./EditTicketForm";

export default async function EditTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.TICKETS_EDIT, { redirectOnForbidden: true });
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!ticket) notFound();
  if (ticket.canceledAt) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
          <h1 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
            Cannot edit canceled ticket
          </h1>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            This ticket has been canceled and cannot be modified.
          </p>
          <Link
            href={`/tickets/${id}`}
            className="mt-4 inline-block text-sm font-medium text-amber-800 underline dark:text-amber-200"
          >
            ← Back to ticket
          </Link>
        </div>
      </main>
    );
  }

  const ticketNumberDisplay =
    ticket.ticketNumber != null
      ? ticket.ticketNumber < 1000
        ? String(ticket.ticketNumber).padStart(3, "0")
        : String(ticket.ticketNumber)
      : ticket.id.slice(-8).toUpperCase();

  const dateStr = new Date(ticket.date).toISOString().slice(0, 10);
  const monthStr = new Date(ticket.date).toISOString().slice(0, 7);
  const departureStr = ticket.departure
    ? new Date(ticket.departure).toISOString().slice(0, 16)
    : "";
  const returnStr = ticket.return
    ? new Date(ticket.return).toISOString().slice(0, 16)
    : "";

  const initial = {
    ticketId: ticket.id,
    ticketNumberDisplay,
    reference: ticket.reference ?? "",
    date: dateStr,
    monthValue: monthStr,
    sponsorName: ticket.sponsor ?? "",
    customerId: ticket.customerId ?? "",
    airline: ticket.airline ?? "",
    route: ticket.route ?? "",
    flight: ticket.flight ?? "",
    departure: departureStr,
    returnDate: returnStr,
    netCost: String(Number(ticket.netCost)),
    netSales: String(Number(ticket.netSales)),
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-6 dark:from-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/tickets/${id}`}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to ticket
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Edit ticket {ticketNumberDisplay}
          </h1>
        </div>
        <EditTicketForm initial={initial} />
      </div>
    </main>
  );
}
