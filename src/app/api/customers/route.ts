import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requirePermission(PERMISSION.CUSTOMERS_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.CUSTOMERS_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const customer = await prisma.customer.create({
      data: {
        name,
        phone: body.phone ? String(body.phone).trim() || null : null,
        whatsappNumber: body.whatsappNumber ? String(body.whatsappNumber).trim() || null : null,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customers POST error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
