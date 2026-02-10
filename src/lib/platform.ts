import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** Require platform admin. Returns response to return if not authorized. */
export async function requirePlatformAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;
  if (!session?.user || !isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden. Platform admin required." }, { status: 403 });
  }
  return null;
}
