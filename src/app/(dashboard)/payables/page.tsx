import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getSystemSettings } from "@/lib/system-settings";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import { isDbConnectionError } from "@/lib/db-safe";
import PayablesTableWithFilters, { type SerializedPayable } from "./PayablesTableWithFilters";
import { auth } from "@/auth";
import { getTenantIdFromSession } from "@/lib/tenant";

export default async function PayablesPage() {
  await requirePermission(PERMISSION.PAYABLES_VIEW, { redirectOnForbidden: true });

  const session = await auth();
  const tenantId = getTenantIdFromSession(session);

  const payablesQuery = () =>
    prisma.payable.findMany({
      where: { 
        tenantId, // SCOPE BY TENANT
        canceledAt: null 
      },
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
    airline: p.ticket?.airline ?? null,
    ticketReference: p.ticket?.reference ?? null,
    visaReference: p.visa?.reference ?? null,
  }));

  const systemSettings = await getSystemSettings();

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Payables</h1>
      </div>
      <PayablesTableWithFilters payables={serialized} systemName={systemSettings.systemName} logoUrl={systemSettings.logoUrl} />
    </main>
  );
}
