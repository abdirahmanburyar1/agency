import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { isDbConnectionError } from "@/lib/db-safe";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import CargoTable from "./CargoTable";

export default async function CargoPage() {
  await requirePermission(PERMISSION.CARGO_VIEW, { redirectOnForbidden: true });
  const canCreate = await canAccess(PERMISSION.CARGO_CREATE);

  let shipments;
  try {
    shipments = await prisma.cargoShipment.findMany({
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
      <div className="mb-6 flex items-center gap-4">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Cargo</h1>
      </div>
      <CargoTable shipments={shipments} canCreate={canCreate} />
    </main>
  );
}
