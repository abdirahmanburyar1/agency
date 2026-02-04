import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trigger, EVENTS } from "@/lib/pusher";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET() {
  await requirePermission(PERMISSION.EXPENSES_VIEW);
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Expenses GET error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await requirePermission(PERMISSION.EXPENSES_CREATE);
  try {
    const body = await request.json();
    const expense = await prisma.expense.create({
      data: {
        date: new Date(body.date),
        month: body.month,
        amount: body.amount,
        description: body.description,
        category: body.category,
        employeeId: body.employeeId || null,
        paidBy: body.paidBy,
        receivedBy: body.receivedBy,
        pMethod: body.pMethod,
        account: body.account,
      },
    });
    trigger(EVENTS.EXPENSE_CREATED, { expense }).catch(() => {});
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Expenses POST error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
