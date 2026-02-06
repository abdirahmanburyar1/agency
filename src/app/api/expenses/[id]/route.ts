import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission(PERMISSION.EXPENSES_VIEW);
  const { id } = await params;
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { employee: true },
  });
  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }
  return NextResponse.json(expense);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requirePermission(PERMISSION.EXPENSES_EDIT);
  const { id } = await params;
  const body = await request.json();
  const amount = body.amount != null ? parseFloat(body.amount) : undefined;
  if (amount != null && (isNaN(amount) || amount <= 0)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(body.date != null && { date: new Date(body.date) }),
      ...(body.month != null && { month: body.month }),
      ...(amount != null && { amount }),
      ...(body.description != null && { description: body.description?.trim() || null }),
      ...(body.category != null && { category: body.category?.trim() || null }),
      ...(body.employeeId != null && { employeeId: body.employeeId || null }),
      ...(body.pMethod != null && { pMethod: body.pMethod?.trim() || null }),
      ...(body.currency != null && { currency: body.currency || "USD" }),
    },
  });
  return NextResponse.json(expense);
}
