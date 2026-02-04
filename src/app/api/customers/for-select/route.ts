import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";
import { canAccess } from "@/lib/permissions";

// Returns { id, name, phone }[] for dropdowns in ticket/visa create forms
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const canView =
    (await canAccess(PERMISSION.CUSTOMERS_VIEW)) ||
    (await canAccess(PERMISSION.TICKETS_CREATE)) ||
    (await canAccess(PERMISSION.TICKETS_EDIT)) ||
    (await canAccess(PERMISSION.VISAS_CREATE)) ||
    (await canAccess(PERMISSION.VISAS_EDIT));
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Customers for-select error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
