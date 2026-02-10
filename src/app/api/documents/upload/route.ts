import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { imagekit } from "@/lib/imagekit";
import { getTenantIdFromSession } from "@/lib/tenant";

export async function POST(request: Request) {
  await requirePermission(PERMISSION.DOCUMENTS_UPLOAD);
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const entityType = formData.get("entityType") as string;
  const entityId = formData.get("entityId") as string;

  if (!file || !entityType || !entityId) {
    return NextResponse.json(
      { error: "file, entityType, and entityId are required" },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["pdf", "jpg", "jpeg", "png", "gif", "webp"];
  if (
    !allowedTypes.includes(file.type) &&
    !(ext && allowedExts.includes(ext))
  ) {
    return NextResponse.json(
      { error: "Only PDF and image files (JPEG, PNG, GIF, WebP) are allowed" },
      { status: 400 }
    );
  }

  try {
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uploadFileName = `daybah_${entityType}_${entityId}_${Date.now()}_${fileName}`;

    const result = await imagekit.files.upload({
      file: file,
      fileName: uploadFileName,
      folder: `/daybah/${entityType}/${entityId}`,
    });

    const doc = await prisma.document.create({
      data: {
        entityType,
        entityId,
        imageKitId: result.fileId ?? "",
        url: result.url ?? "",
        fileName: file.name,
        tenantId: getTenantIdFromSession(session ?? null),
        ...(userId && { createdBy: userId }),
      },
    });

    return NextResponse.json(doc);
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
