import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
} from "@prisma/client/runtime/library";

const DB_CONNECTION_CODES = ["P1001", "P1002", "P1017"];

/** Message substrings that indicate DB unreachable (handles bundled/turbopack when instanceof fails). */
const DB_UNREACHABLE_MESSAGES = [
  "Can't reach database server",
  "Connection refused",
  "connect ECONNREFUSED",
  "P1001",
  "PrismaClientInitializationError",
];

export function isDbConnectionError(err: unknown): boolean {
  if (err instanceof PrismaClientInitializationError) return true;
  if (err instanceof PrismaClientKnownRequestError) {
    return DB_CONNECTION_CODES.includes(err.code);
  }
  const msg = err && typeof err === "object" && "message" in err ? String((err as Error).message) : "";
  if (msg && DB_UNREACHABLE_MESSAGES.some((m) => msg.includes(m))) return true;
  return false;
}
