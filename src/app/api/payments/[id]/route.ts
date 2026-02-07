import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getPaymentVisibilityWhere } from "@/lib/cargo";
import { handleAuthError } from "@/lib/api-auth";

function hasCargoPermission(permissions: string[]): boolean {
  return permissions.some((p) => p.startsWith("cargo."));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requirePermission(PERMISSION.PAYMENTS_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id } = await params;
    const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
    const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
    const locationId = (session.user as { locationId?: string | null }).locationId ?? null;
    const isAdminOrViewAll = roleName.toLowerCase() === "admin" || permissions.includes(PERMISSION.CARGO_VIEW_ALL);
    const paymentWhere = getPaymentVisibilityWhere(isAdminOrViewAll, hasCargoPermission(permissions), locationId);

    const payment = await prisma.payment.findFirst({
      where: { id, ...paymentWhere },
      include: {
        ticket: { include: { customer: true } },
        visa: { include: { customerRelation: true } },
        hajUmrahBooking: { include: { customer: true } },
        receipts: true,
      },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json(payment);
  } catch (error) {
    console.error("Payment GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}
