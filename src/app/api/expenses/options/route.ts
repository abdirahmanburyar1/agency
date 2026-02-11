import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";
import { getTenantIdFromSession } from "@/lib/tenant";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canView =
    (await canAccess(PERMISSION.EXPENSES_VIEW)) ||
    (await canAccess(PERMISSION.EXPENSES_CREATE)) ||
    (await canAccess(PERMISSION.EXPENSES_EDIT));
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenantId = getTenantIdFromSession(session);

  const [settings, employees, expenses] = await Promise.all([
    prisma.setting.findMany({
      where: { 
        tenantId, // SCOPE BY TENANT
        type: "expense_category" 
      },
      orderBy: [{ sortOrder: "asc" }, { value: "asc" }],
    }),
    prisma.employee.findMany({
      where: {
        tenantId, // SCOPE BY TENANT
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, phone: true },
    }),
    prisma.expense.findMany({
      where: {
        tenantId, // SCOPE BY TENANT
      },
      select: { category: true, pMethod: true },
    }),
  ]);

  const categoriesFromSettings = settings.map((s) => s.value);
  const categoriesFromExpenses = [...new Set(expenses.map((e) => e.category).filter((c): c is string => !!c))];
  const categories = [...new Set([...categoriesFromSettings, ...categoriesFromExpenses])].sort();

  const pMethodsFromExpenses = [...new Set(expenses.map((e) => e.pMethod).filter((m): m is string => !!m))];
  const paymentMethods = await prisma.setting
    .findMany({ where: { type: "payment_method" }, orderBy: { value: "asc" } })
    .then((s) => s.map((x) => x.value));
  const pMethods = [...new Set([...paymentMethods, ...pMethodsFromExpenses])].sort();

  return NextResponse.json({
    categories,
    employees,
    paymentMethods: pMethods,
  });
}
