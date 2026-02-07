import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { generateTrackingNumber, CARGO_RATE_PER_KG } from "@/lib/cargo";

export async function GET() {
  await requirePermission(PERMISSION.CARGO_VIEW);
  try {
    const shipments = await prisma.cargoShipment.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    return NextResponse.json(shipments);
  } catch (error) {
    console.error("Cargo GET error:", error);
    return NextResponse.json({ error: "Failed to fetch cargo shipments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requirePermission(PERMISSION.CARGO_CREATE);
  try {
    const session = await auth();
    const user = session?.user as { branchId?: string | null } | undefined;
    const userBranchId = user?.branchId ?? null;

    const body = await request.json();
    const senderName = String(body.senderName ?? "").trim();
    const senderPhone = String(body.senderPhone ?? "").trim();
    const receiverName = String(body.receiverName ?? "").trim();
    const receiverPhone = String(body.receiverPhone ?? "").trim();
    const sourceBranchId = body.sourceBranchId?.trim();
    const destinationBranchId = body.destinationBranchId?.trim();
    const rawMode = String(body.transportMode ?? "air").toLowerCase();
    const transportMode = ["air", "road", "sea"].includes(rawMode) ? rawMode : "air";
    const carrier = String(body.carrier ?? "").trim();
    const currency = String(body.currency ?? "USD").trim().toUpperCase() || "USD";
    const items = Array.isArray(body.items) ? body.items : [];

    if (!senderName || !receiverName || !sourceBranchId || !destinationBranchId) {
      return NextResponse.json(
        { error: "Sender name, receiver name, source, and destination are required" },
        { status: 400 }
      );
    }
    if (!userBranchId || sourceBranchId !== userBranchId) {
      return NextResponse.json(
        { error: "Source must be your assigned branch" },
        { status: 403 }
      );
    }
    const [sourceBranch, destBranch] = await Promise.all([
      prisma.branch.findUnique({ where: { id: sourceBranchId }, include: { location: true } }),
      prisma.branch.findUnique({ where: { id: destinationBranchId }, include: { location: true } }),
    ]);
    if (!sourceBranch || !destBranch) {
      return NextResponse.json({ error: "Invalid source or destination branch" }, { status: 400 });
    }
    const source = `${sourceBranch.location.name} - ${sourceBranch.name}`;
    const destination = `${destBranch.location.name} - ${destBranch.name}`;
    if (items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    const validItems = items
      .filter(
        (i: { description?: string; quantity?: number; weight?: number; unitPrice?: number }) =>
          i.description != null && i.quantity != null && i.weight != null
      )
      .map((i: { description: string; quantity: number; weight: number; unitPrice?: number }) => ({
        description: String(i.description).trim(),
        quantity: Math.max(0, Number(i.quantity) || 0),
        weight: Math.max(0, Number(i.weight) || 0),
        unitPrice: Math.max(0, Number(i.unitPrice) ?? CARGO_RATE_PER_KG),
      }))
      .filter((i) => i.description && (i.quantity > 0 || i.weight > 0));

    if (validItems.length === 0) {
      return NextResponse.json({ error: "At least one valid item is required" }, { status: 400 });
    }

    const totalWeight = validItems.reduce((sum, i) => sum + i.weight * i.quantity, 0);
    const price = validItems.reduce((sum, i) => sum + i.quantity * i.weight * i.unitPrice, 0);
    const trackingNumber = await generateTrackingNumber();
    const status = "PENDING";

    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.cargoShipment.create({
        data: {
          trackingNumber,
          senderName,
          senderPhone,
          receiverName,
          receiverPhone,
          source,
          destination,
          sourceBranchId,
          destinationBranchId,
          transportMode,
          carrier,
          totalWeight,
          price,
          currency,
          status,
        },
      });
      await tx.cargoItem.createMany({
        data: validItems.map((i) => ({
          cargoShipmentId: created.id,
          description: i.description,
          quantity: i.quantity,
          weight: i.weight,
          unitPrice: i.unitPrice,
        })),
      });
      await tx.cargoTrackingLog.create({
        data: {
          cargoShipmentId: created.id,
          status,
          note: "Awaiting payment",
        },
      });
      return tx.cargoShipment.findUniqueOrThrow({
        where: { id: created.id },
        include: { items: true, logs: { orderBy: { createdAt: "asc" } } },
      });
    });

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("Cargo POST error:", error);
    const message = error instanceof Error ? error.message : "Failed to create cargo shipment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
