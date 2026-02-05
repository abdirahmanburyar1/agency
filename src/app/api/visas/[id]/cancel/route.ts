import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.VISAS_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id } = await params;

    const visa = await prisma.visa.findUnique({
      where: { id },
      include: { payments: true, payables: true },
    });

    if (!visa) {
      return NextResponse.json({ error: "Visa not found" }, { status: 404 });
    }

    if (visa.canceledAt) {
      return NextResponse.json(
        { error: "Visa is already canceled" },
        { status: 400 }
      );
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.visa.update({
        where: { id },
        data: { canceledAt: now },
      }),
      ...visa.payments.map((p) =>
        prisma.payment.update({
          where: { id: p.id },
          data: { canceledAt: now },
        })
      ),
      ...visa.payables.map((p) =>
        prisma.payable.update({
          where: { id: p.id },
          data: { canceledAt: now },
        })
      ),
    ]);

    return NextResponse.json({ success: true, canceledAt: now });
  } catch (error) {
    console.error("Cancel visa error:", error);
    return NextResponse.json(
      { error: "Failed to cancel visa" },
      { status: 500 }
    );
  }
}
