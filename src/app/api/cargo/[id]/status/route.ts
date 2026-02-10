import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { CARGO_STATUSES, getCargoStatusActions } from "@/lib/cargo";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePermission(PERMISSION.CARGO_EDIT);
  try {
    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "").trim().toUpperCase();
    const note = body.note != null ? String(body.note).trim() : null;

    if (!CARGO_STATUSES.includes(status as (typeof CARGO_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${CARGO_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const shipment = await prisma.cargoShipment.findUnique({ where: { id } });
    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const userBranchId = (session.user as { branchId?: string | null }).branchId ?? null;
    const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
    const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
    const isAdminOrViewAll = roleName.toLowerCase() === "admin" || permissions.includes(PERMISSION.CARGO_VIEW_ALL);

    const { allowedNextStatuses } = getCargoStatusActions(
      userBranchId,
      shipment.sourceBranchId,
      shipment.destinationBranchId,
      shipment.status,
      isAdminOrViewAll
    );

    if (!(allowedNextStatuses as readonly string[]).includes(status)) {
      return NextResponse.json(
        { error: "Your branch is not allowed to perform this status change" },
        { status: 403 }
      );
    }

    const previousStatus = shipment.status;
    const isPendingToWarehouse = previousStatus === "PENDING" && status === "WAREHOUSE";

    const existingPayment = isPendingToWarehouse
      ? await prisma.payment.findFirst({ where: { cargoShipmentId: id, canceledAt: null } })
      : null;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.cargoShipment.update({
        where: { id },
        data: { status },
      });
      await tx.cargoTrackingLog.create({
        data: {
          cargoShipmentId: id,
          status,
          note: note ?? undefined,
        },
      });
      if (isPendingToWarehouse && !existingPayment) {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        await tx.payment.create({
          data: {
            tenantId: shipment.tenantId,
            date: now,
            month,
            paymentDate: now,
            status: "pending",
            name: `Cargo: ${shipment.trackingNumber}`,
            description: `${shipment.senderName} → ${shipment.receiverName} (${shipment.source} to ${shipment.destination})`,
            amount: shipment.price,
            currency: (shipment as { currency?: string }).currency ?? "USD",
            cargoShipmentId: id,
          },
        });
      }
      return tx.cargoShipment.findUniqueOrThrow({
        where: { id },
        include: { items: true, logs: { orderBy: { createdAt: "asc" } } },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Cargo status PATCH error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
