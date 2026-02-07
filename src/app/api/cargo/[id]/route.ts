import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission(PERMISSION.CARGO_VIEW);
  try {
    const { id } = await params;
    const shipment = await prisma.cargoShipment.findUnique({
      where: { id },
      include: {
        items: true,
        logs: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }
    return NextResponse.json(shipment);
  } catch (error) {
    console.error("Cargo [id] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch shipment" }, { status: 500 });
  }
}
