import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getCargoVisibilityWhere } from "@/lib/cargo";
import { isDbConnectionError } from "@/lib/db-safe";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import CargoTable from "./CargoTable";

export default async function CargoPage() {
  const session = await requirePermission(PERMISSION.CARGO_VIEW, { redirectOnForbidden: true });
  const canCreate = await canAccess(PERMISSION.CARGO_CREATE);

  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
  const locationId = (session.user as { locationId?: string | null }).locationId ?? null;
  const isAdminOrViewAll = roleName.toLowerCase() === "admin" || permissions.includes(PERMISSION.CARGO_VIEW_ALL);
  const cargoWhere = getCargoVisibilityWhere(isAdminOrViewAll, locationId);

  let shipments;
  try {
    shipments = await prisma.cargoShipment.findMany({
      where: cargoWhere,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  } catch (err) {
    if (isDbConnectionError(err)) {
      return (
        <main className="w-full max-w-full py-4 sm:py-6">
          <div className="mb-4">
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

  return (
    <main className="w-full max-w-full py-4 sm:py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Cargo</h1>
        </div>
        <Link
          href="/reports/cargo"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/50"
        >
          Cargo Report
        </Link>
      </div>
      <CargoTable shipments={shipments} canCreate={canCreate} />
    </main>
  );
}
