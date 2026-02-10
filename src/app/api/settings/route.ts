import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getTenantIdFromSession } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

const TYPES = ["airline", "payment_method", "flight", "payment_status", "country", "expense_category", "cargo_carrier_air", "cargo_carrier_road", "cargo_carrier_sea"] as const;

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSION.SETTINGS_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const types = type && TYPES.includes(type as (typeof TYPES)[number])
    ? [type]
    : TYPES;
  const session = await auth();
  const tenantId = getTenantIdFromSession(session);

  const settings = await prisma.setting.findMany({
    where: { tenantId, type: { in: [...types] } },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { value: "asc" }],
  });

  const grouped = types.reduce((acc, t) => {
    acc[t] = settings.filter((s) => s.type === t).map((s) => s.value);
    return acc;
  }, {} as Record<string, string[]>);

  return NextResponse.json(type ? grouped[type] ?? [] : grouped);
}

export async function POST(request: Request) {
  const { type, value } = await request.json();
  if (!type || !value || !TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Invalid type or value. Type must be: airline, payment_method, flight, payment_status, country, expense_category, cargo_carrier_air, cargo_carrier_road, cargo_carrier_sea" },
      { status: 400 }
    );
  }
  try {
    await requirePermission(PERMISSION.SETTINGS_EDIT);
  } catch {
    if (type === "airline") {
      try {
        await requirePermission(PERMISSION.TICKETS_CREATE);
      } catch (e) {
        const res = handleAuthError(e);
        if (res) return res;
        throw e;
      }
    } else if (type === "country") {
      try {
        await requirePermission(PERMISSION.VISAS_CREATE);
      } catch (e) {
        const res = handleAuthError(e);
        if (res) return res;
        throw e;
      }
    } else if (type === "expense_category") {
      try {
        await requirePermission(PERMISSION.EXPENSES_CREATE);
      } catch (e) {
        const res = handleAuthError(e);
        if (res) return res;
        throw e;
      }
    } else if (type.startsWith("cargo_carrier_")) {
      try {
        await requirePermission(PERMISSION.CARGO_CREATE);
      } catch (e) {
        const res = handleAuthError(e);
        if (res) return res;
        throw e;
      }
    } else {
      const res = handleAuthError(new Error("Forbidden") as never);
      if (res) return res;
      throw new Error("Forbidden");
    }
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Value cannot be empty" }, { status: 400 });
  }
  const session = await auth();
  const tenantId = getTenantIdFromSession(session);
  const existing = await prisma.setting.findUnique({
    where: { tenantId_type_value: { tenantId, type, value: trimmed } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already exists" }, { status: 400 });
  }
  const setting = await prisma.setting.create({
    data: { tenantId, type, value: trimmed },
  });
  return NextResponse.json(setting);
}
