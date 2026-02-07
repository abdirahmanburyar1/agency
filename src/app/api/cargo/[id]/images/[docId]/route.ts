import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { imagekit } from "@/lib/imagekit";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { auth } from "@/auth";
import { getCargoVisibilityWhere } from "@/lib/cargo";
import { handleAuthError } from "@/lib/api-auth";

async function assertCanAccessShipment(shipmentId: string) {
  const session = await auth();
  if (!session?.user) return false;

  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
  const locationId = (session.user as { locationId?: string | null }).locationId ?? null;
  const isAdminOrViewAll = roleName.toLowerCase() === "admin" || permissions.includes(PERMISSION.CARGO_VIEW_ALL);
  const cargoWhere = getCargoVisibilityWhere(isAdminOrViewAll, locationId);

  const shipment = await prisma.cargoShipment.findFirst({
    where: { id: shipmentId, ...cargoWhere },
  });
  return !!shipment;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    await requirePermission(PERMISSION.CARGO_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }

  try {
    const { id: shipmentId, docId } = await params;
    const canAccess = await assertCanAccessShipment(shipmentId);
    if (!canAccess) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const doc = await prisma.document.findFirst({
      where: {
        id: docId,
        entityType: "cargo",
        entityId: shipmentId,
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    try {
      await imagekit.files.delete(doc.imageKitId);
    } catch (ikError) {
      console.error("ImageKit delete error:", ikError);
    }

    await prisma.document.delete({ where: { id: docId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cargo image delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
