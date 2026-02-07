import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PERMISSION } from "@/lib/permissions";
import { getPaymentVisibilityWhere } from "@/lib/cargo";
function hasCargoPermission(permissions: string[]): boolean {
  return permissions.some((p) => p.startsWith("cargo."));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  const hasPaymentsView = permissions.includes(PERMISSION.PAYMENTS_VIEW);
  const hasCargoView = permissions.some((p) => p.startsWith("cargo."));
  if (!hasPaymentsView && !hasCargoView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
    const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
    const locationId = (session.user as { locationId?: string | null }).locationId ?? null;
    const isAdminOrCargoViewAll = roleName.toLowerCase() === "admin" || permissions.includes(PERMISSION.CARGO_VIEW_ALL);
    const hasPaymentsViewAll = permissions.includes(PERMISSION.PAYMENTS_VIEW_ALL);
    const hasCargoOrPaymentsView = hasCargoPermission(permissions) || permissions.includes(PERMISSION.PAYMENTS_VIEW);
    const paymentWhere = getPaymentVisibilityWhere(
      isAdminOrCargoViewAll,
      hasPaymentsViewAll,
      hasCargoOrPaymentsView,
      locationId
    );

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
