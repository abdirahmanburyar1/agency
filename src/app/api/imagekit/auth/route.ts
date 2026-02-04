import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { imagekit } from "@/lib/imagekit";
import { canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

// ImageKit client-side auth for direct uploads (optional)
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const hasUpload = await canAccess(PERMISSION.DOCUMENTS_UPLOAD);
  if (!hasUpload) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const token = imagekit.helper.getAuthenticationParameters();
    return NextResponse.json(token);
  } catch {
    return NextResponse.json(
      { error: "ImageKit not configured" },
      { status: 500 }
    );
  }
}
