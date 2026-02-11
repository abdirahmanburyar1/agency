import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trigger, EVENTS } from "@/lib/pusher";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { auth } from "@/auth";
import { getTenantIdFromSession } from "@/lib/tenant";

export async function GET() {
  await requirePermission(PERMISSION.EXPENSES_VIEW);
  try {
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId, // SCOPE BY TENANT
      },
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
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 25);
    const date = new Date(body.date);
    const month = String(body.month);
    const amount = Number(body.amount);
    const currency = body.currency ?? "USD";
    const description = body.description ?? null;
    const category = body.category ?? null;
    const employeeId = body.employeeId || null;
    const paidBy = body.paidBy ?? null;
    const receivedBy = body.receivedBy ?? null;
    const pMethod = body.pMethod ?? null;
    const account = body.account ?? null;

    await prisma.$executeRaw`
      INSERT INTO expenses (id, date, month, amount, currency, description, category, employee_id, paid_by, received_by, p_method, account, status)
      VALUES (${id}, ${date}, ${month}, ${amount}, ${currency}, ${description}, ${category}, ${employeeId}, ${paidBy}, ${receivedBy}, ${pMethod}, ${account}, 'pending')
    `;

    const expense = await prisma.expense.findUniqueOrThrow({ where: { id } });
    trigger(EVENTS.EXPENSE_CREATED, { expense }).catch(() => {});
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Expenses POST error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
