import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { trigger, EVENTS } from "@/lib/pusher";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getPaymentVisibilityWhere } from "@/lib/cargo";
import { handleAuthError } from "@/lib/api-auth";
import { getTenantIdFromSession } from "@/lib/tenant";

function hasCargoPermission(permissions: string[]): boolean {
  return permissions.some((p) => p.startsWith("cargo."));
}

export async function GET() {
  let session;
  try {
    session = await requirePermission(PERMISSION.PAYMENTS_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const tenantId = getTenantIdFromSession(session);
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

    const payments = await prisma.payment.findMany({
      where: {
        tenantId, // SCOPE BY TENANT
        ...paymentWhere,
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.PAYMENTS_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    const body = await request.json();
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        date: new Date(body.date),
        month: body.month,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(body.date),
        status: body.status ?? "pending",
        name: body.name,
        description: body.description,
        amount: body.amount,
        ticketId: body.ticketId ?? undefined,
        visaId: body.visaId ?? undefined,
        hajUmrahBookingId: body.hajUmrahBookingId ?? undefined,
      },
    });
    trigger(EVENTS.PAYMENT_CREATED, { payment }).catch(() => {});
    return NextResponse.json(payment);
  } catch (error) {
    console.error("Payments POST error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
