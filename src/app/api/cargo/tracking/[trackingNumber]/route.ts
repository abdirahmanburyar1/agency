import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public tracking endpoint - no auth required
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    const normalized = decodeURIComponent(trackingNumber ?? "").trim().toUpperCase();
    if (!normalized) {
      return NextResponse.json({ error: "Tracking number is required" }, { status: 400 });
    }

    const shipment = await prisma.cargoShipment.findFirst({
      where: { trackingNumber: normalized },
      include: {
        logs: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found", found: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      trackingNumber: shipment.trackingNumber,
      source: shipment.source,
      destination: shipment.destination,
      transportMode: shipment.transportMode,
      carrier: shipment.carrier,
      status: shipment.status,
      logs: shipment.logs.map((l) => ({
        status: l.status,
        note: l.note,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    console.error("Cargo tracking GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tracking info" }, { status: 500 });
  }
}
