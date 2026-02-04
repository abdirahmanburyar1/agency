import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const perms = (session.user as { permissions?: string[] }).permissions ?? [];
  const isAdmin = (session.user as { roleName?: string }).roleName === "Admin";
  if (!isAdmin && !perms.includes(PERMISSION.DOCUMENTS_VIEW)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "entityType and entityId are required" },
      { status: 400 }
    );
  }

  const docs = await prisma.document.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(docs);
}
