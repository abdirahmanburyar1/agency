import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import TicketsTableWithFilters from "./TicketsTableWithFilters";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import { isDbConnectionError } from "@/lib/db-safe";

export default async function TicketsPage() {
  await requirePermission(PERMISSION.TICKETS_VIEW, { redirectOnForbidden: true });
  const canCreate = await (await import("@/lib/permissions")).canAccess(
    PERMISSION.TICKETS_CREATE
  );

  let tickets: Awaited<ReturnType<typeof prisma.ticket.findMany>>;
  let customers: Awaited<ReturnType<typeof prisma.customer.findMany>>;
  let airlineRows: { airline: string | null }[];
  try {
    const result = await Promise.all([
      prisma.ticket.findMany({
        where: { canceledAt: null },
        orderBy: { createdAt: "desc" },
        include: { customer: true },
      }),
      prisma.customer.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.ticket.findMany({
        where: { airline: { not: null } },
        select: { airline: true },
        distinct: ["airline"],
      }),
    ]);
    tickets = result[0];
    customers = result[1];
    airlineRows = result[2];
  } catch (err) {
    if (isDbConnectionError(err)) {
      return (
        <main className="w-full py-6 sm:py-8">
          <div className="mb-6">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              ← Back
            </Link>
          </div>
          <DatabaseErrorBanner />
        </main>
      );
    }
    throw err;
  }

  const airlines = airlineRows
    .map((r) => r.airline)
    .filter((a): a is string => a != null)
    .sort();

  const serializedTickets = tickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    reference: t.reference ?? "",
    date: t.date.toISOString(),
    customerId: t.customerId,
    customerName: t.customerName,
    airline: t.airline,
    netCost: Number(t.netCost),
    netSales: Number(t.netSales),
    profit: Number(t.profit),
    customer: t.customer
      ? { name: t.customer.name, phone: t.customer.phone }
      : null,
  }));

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Tickets
          </h1>
        </div>
        {canCreate && (
          <Link
            href="/tickets/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Create Ticket
          </Link>
        )}
      </div>

      <TicketsTableWithFilters
        tickets={serializedTickets}
        airlines={airlines}
      />
    </main>
  );
}
