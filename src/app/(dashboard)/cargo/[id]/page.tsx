import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CargoDetailClient from "./CargoDetailClient";

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
  await requirePermission(PERMISSION.CARGO_VIEW, { redirectOnForbidden: true });
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
  const canViewPayments = await canAccess(PERMISSION.PAYMENTS_VIEW);

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
        canEdit={canEdit}
        statusStyles={STATUS_STYLES}
        paymentId={payment?.id ?? null}
        canViewPayments={canViewPayments}
      />
    </main>
  );
}
