import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import VisasTableWithFilters from "./VisasTableWithFilters";

export default async function VisasPage() {
  await requirePermission(PERMISSION.VISAS_VIEW, { redirectOnForbidden: true });
  const [canCreate, canEdit] = await Promise.all([
    (await import("@/lib/permissions")).canAccess(PERMISSION.VISAS_CREATE),
    (await import("@/lib/permissions")).canAccess(PERMISSION.VISAS_EDIT),
  ]);

  const [visas, countryRows] = await Promise.all([
    prisma.visa.findMany({
      orderBy: { date: "desc" },
      include: { customerRelation: true },
    }),
    prisma.visa.findMany({
      where: { country: { not: null } },
      select: { country: true },
      distinct: ["country"],
    }),
  ]);

  const countries = countryRows
    .map((r) => r.country)
    .filter((c): c is string => c != null)
    .sort();

  const serializedVisas = visas.map((v) => ({
    id: v.id,
    visaNumber: v.visaNumber,
    reference: v.reference ?? "",
    date: v.date.toISOString(),
    customerId: v.customerId,
    customer: v.customer,
    country: v.country,
    netCost: Number(v.netCost),
    netSales: Number(v.netSales),
    profit: Number(v.profit),
    customerRelation: v.customerRelation
      ? { name: v.customerRelation.name, phone: v.customerRelation.phone }
      : null,
    canceledAt: v.canceledAt?.toISOString() ?? null,
  }));

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="shrink-0 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back
          </Link>
          <h1 className="truncate text-xl font-semibold text-zinc-900 dark:text-white">Visas</h1>
        </div>
        {canCreate && (
          <Link
            href="/visas/new"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Create Visa
          </Link>
        )}
      </div>

      <VisasTableWithFilters
        visas={serializedVisas}
        countries={countries}
        canEdit={canEdit}
      />
    </main>
  );
}
