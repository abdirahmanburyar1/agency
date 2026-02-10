import { NextResponse } from "next/server";
import { imagekit } from "@/lib/imagekit";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "ico"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"];

function isImageFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return (
    IMAGE_TYPES.includes(file.type) ||
    (!!ext && IMAGE_EXTENSIONS.includes(ext))
  );
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.SETTINGS_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // "logo" | "favicon"

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Please select an image file" },
        { status: 400 }
      );
    }

    if (type !== "logo" && type !== "favicon") {
      return NextResponse.json(
        { error: "type must be 'logo' or 'favicon'" },
        { status: 400 }
      );
    }

    if (!isImageFile(file)) {
      return NextResponse.json(
        { error: `Only image files allowed (${IMAGE_EXTENSIONS.join(", ")})` },
        { status: 400 }
      );
    }

    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uploadFileName = `system_${type}_${Date.now()}_${fileName}`;

    const result = await imagekit.files.upload({
      file,
      fileName: uploadFileName,
      folder: `/daybah/system/${type}`,
    });

    const url = result.url ?? "";
    if (!url) {
      return NextResponse.json(
        { error: "Upload succeeded but no URL returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("System settings image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
