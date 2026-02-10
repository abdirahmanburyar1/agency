"use client";

import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

type LeaderShellProps = {
  children: React.ReactNode;
  userEmail: string;
  userName: string | null;
  systemName?: string;
  logoUrl?: string;
};

export default function LeaderShell({ children, userEmail, userName, systemName = "Daybah Travel Agency", logoUrl = "/logo.png" }: LeaderShellProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:px-6">
        <Link
          href="/leader"
          className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg text-zinc-900 hover:bg-zinc-100 dark:text-white dark:hover:bg-zinc-800"
        >
          <img src={logoUrl} alt={systemName} className="h-9 w-auto max-w-[140px] object-contain" />
          <span className="hidden text-lg font-semibold sm:inline">My Campaigns</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-[180px] truncate text-sm text-zinc-600 dark:text-zinc-400 sm:inline">
            {userName || userEmail}
          </span>
          <SignOutButton className="min-h-[44px] min-w-[44px] px-4 py-2" />
        </div>
      </header>
      <main className="w-full px-4 py-6 sm:px-6 sm:py-8 md:max-w-5xl md:mx-auto">
        {children}
      </main>
    </div>
  );
}
