import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { imagekit } from "@/lib/imagekit";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getCargoVisibilityWhere } from "@/lib/cargo";
import { handleAuthError } from "@/lib/api-auth";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "bmp"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"];

function isImageFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    IMAGE_TYPES.includes(file.type) ||
    (!!ext && IMAGE_EXTENSIONS.includes(ext))
  );
}

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.CARGO_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }

  try {
    const { id: shipmentId } = await params;
    const canAccess = await assertCanAccessShipment(shipmentId);
    if (!canAccess) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const docs = await prisma.document.findMany({
      where: { entityType: "cargo", entityId: shipmentId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(docs);
  } catch (error) {
    console.error("Cargo images GET error:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.CARGO_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }

  try {
    const { id: shipmentId } = await params;
    const canAccess = await assertCanAccessShipment(shipmentId);
    if (!canAccess) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Please select an image file" },
        { status: 400 }
      );
    }

    if (!isImageFile(file)) {
      return NextResponse.json(
        { error: `Only image files are allowed (${IMAGE_EXTENSIONS.join(", ")})` },
        { status: 400 }
      );
    }

    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uploadFileName = `cargo_${shipmentId}_${Date.now()}_${fileName}`;

    const result = await imagekit.files.upload({
      file,
      fileName: uploadFileName,
      folder: `/daybah/cargo/${shipmentId}`,
    });

    const doc = await prisma.document.create({
      data: {
        entityType: "cargo",
        entityId: shipmentId,
        imageKitId: result.fileId ?? "",
        url: result.url ?? "",
        fileName: file.name,
        createdBy: userId ?? undefined,
      },
    });

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Cargo image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
