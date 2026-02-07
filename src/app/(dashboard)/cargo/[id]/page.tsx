import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getCargoStatusActions } from "@/lib/cargo";
import CargoDetailClient from "./CargoDetailClient";
import CargoImages from "./CargoImages";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  WAREHOUSE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  ASSIGNED_TO_MANIFEST: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  DISPATCHED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  ARRIVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export default async function CargoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSION.CARGO_VIEW, { redirectOnForbidden: true });
  const { id } = await params;

  const [shipment, payment] = await Promise.all([
    prisma.cargoShipment.findUnique({
      where: { id },
      include: { items: true, logs: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.payment.findFirst({
      where: { cargoShipmentId: id, canceledAt: null },
    }),
  ]);

  if (!shipment) notFound();

  const canEdit = await canAccess(PERMISSION.CARGO_EDIT);
  const canViewPayments =
    (await canAccess(PERMISSION.PAYMENTS_VIEW)) || !!payment?.id; // Cargo Section: view payment link from cargo detail only

  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
  const userBranchId = (session.user as { branchId?: string | null }).branchId ?? null;
  const isAdminOrViewAll = roleName.toLowerCase() === "admin" || permissions.includes(PERMISSION.CARGO_VIEW_ALL);

  const { canShowActions, allowedNextStatuses } = getCargoStatusActions(
    userBranchId,
    shipment.sourceBranchId,
    shipment.destinationBranchId,
    shipment.status,
    isAdminOrViewAll
  );

  const canShowStatusActions = canEdit && canShowActions;

  const serialized = {
    ...shipment,
    createdAt: shipment.createdAt.toISOString(),
    logs: shipment.logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
  };

  return (
    <main className="w-full max-w-full py-4 sm:py-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/cargo"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to Cargo
        </Link>
      </div>
      <CargoDetailClient
        shipment={serialized}
        canShowStatusActions={canShowStatusActions}
        allowedNextStatuses={allowedNextStatuses}
        statusStyles={STATUS_STYLES}
        paymentId={payment?.id ?? null}
        canViewPayments={canViewPayments}
      />
      <div className="mt-6">
        <CargoImages
          shipmentId={id}
          canUpload={canEdit && canShowActions}
          canDelete={canEdit && canShowActions}
        />
      </div>
    </main>
  );
}
