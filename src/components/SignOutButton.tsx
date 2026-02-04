"use client";

import { signOut } from "next-auth/react";

type Props = { className?: string };
export function SignOutButton({ className = "" }: Props) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={`rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 ${className}`.trim()}
    >
      Sign out
    </button>
  );
}
