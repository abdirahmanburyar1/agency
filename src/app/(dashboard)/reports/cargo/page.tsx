import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getCargoReportVisibilityWhere } from "@/lib/cargo";
import { getCargoReportData } from "@/lib/cargo-report";
import { getSystemSettings } from "@/lib/system-settings";
import CargoReportView from "./CargoReportView";

export const dynamic = "force-dynamic";

function hasCargoPermission(permissions: string[]): boolean {
  return permissions.some((p) => p.startsWith("cargo."));
}

export default async function CargoReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; status?: string; source?: string; dest?: string }>;
}) {
  await requirePermission(PERMISSION.CARGO_VIEW, { redirectOnForbidden: true });

  const session = await auth();
  const permissions = (session?.user as { permissions?: string[] })?.permissions ?? [];
  const roleName = String((session?.user as { roleName?: string })?.roleName ?? "").trim();
  const locationId = (session?.user as { locationId?: string | null })?.locationId ?? null;
  const branchId = (session?.user as { branchId?: string | null })?.branchId ?? null;
  const isAdminOrViewAll = roleName.toLowerCase() === "admin" || permissions.includes(PERMISSION.CARGO_VIEW_ALL);

  const visibilityWhere = getCargoReportVisibilityWhere(isAdminOrViewAll, locationId, branchId);

  const params = await searchParams;
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fromStr = params.from ?? "";
  const toStr = params.to ?? "";
  const fromDate = fromStr ? new Date(fromStr) : defaultFrom;
  const toDate = toStr ? new Date(toStr) : defaultTo;
  const validRange =
    !Number.isNaN(fromDate.getTime()) &&
    !Number.isNaN(toDate.getTime()) &&
    fromDate <= toDate;

  const filter = {
    fromDate: validRange ? fromDate : defaultFrom,
    toDate: validRange ? toDate : defaultTo,
    status: params.status || undefined,
    sourceLocationId: params.source || undefined,
    destinationLocationId: params.dest || undefined,
  };

  const data = await getCargoReportData(filter, visibilityWhere);

  const [locations, canViewReports, systemSettings] = await Promise.all([
    prisma.cargoLocation.findMany({ orderBy: { name: "asc" } }),
    canAccess(PERMISSION.REPORTS_VIEW),
    getSystemSettings(),
  ]);

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={canViewReports ? "/reports" : "/cargo"}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← {canViewReports ? "Reports" : "Cargo"}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Cargo Report</h1>
        </div>
      </div>
      <CargoReportView initialData={data} locations={locations} systemName={systemSettings.systemName} logoUrl={systemSettings.logoUrl} />
    </main>
  );
}
