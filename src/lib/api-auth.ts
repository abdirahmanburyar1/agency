import { AuthError } from "./permissions";
import { NextResponse } from "next/server";

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  return null;
}
