import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import { isDbConnectionError } from "@/lib/db-safe";
import PayablesTableWithFilters, { type SerializedPayable } from "./PayablesTableWithFilters";

export default async function PayablesPage() {
  await requirePermission(PERMISSION.PAYABLES_VIEW, { redirectOnForbidden: true });

  const payablesQuery = () =>
    prisma.payable.findMany({
      where: { canceledAt: null },
      orderBy: { date: "desc" },
      include: { ticket: true, visa: true },
    });
  let payables: Awaited<ReturnType<typeof payablesQuery>>;
  try {
    payables = await payablesQuery();
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

  const serialized: SerializedPayable[] = payables.map((p) => ({
    id: p.id,
    date: p.date.toISOString(),
    name: p.name,
    description: p.description,
    amount: Number(p.amount),
    balance: Number(p.balance),
    deadline: p.deadline?.toISOString() ?? null,
    remaining: p.remaining,
    source: p.ticketId ? "ticket" : p.visaId ? "visa" : p.hajUmrahBookingId ? "haj_umrah" : null,
    ticketId: p.ticketId,
    visaId: p.visaId,
    hajUmrahBookingId: p.hajUmrahBookingId,
  }));

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Payables</h1>
      </div>
      <PayablesTableWithFilters payables={serialized} />
    </main>
  );
}
