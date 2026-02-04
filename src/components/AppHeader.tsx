"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";

type AppHeaderProps = {
  userEmail: string;
  userName: string | null;
  roleName: string;
  adminLinks: { href: string; label: string }[];
};

export default function AppHeader({
  userEmail,
  userName,
  roleName,
  adminLinks,
}: AppHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = userName || userEmail?.split("@")[0] || "User";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm print:hidden dark:border-slate-800 dark:bg-slate-900 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            const event = new CustomEvent("toggle-sidebar");
            window.dispatchEvent(event);
          }}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Toggle menu"
        >
          <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{roleName} · {userEmail}</p>
          </div>
          <svg
            className={`size-4 text-slate-500 transition ${userMenuOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
            </div>
            {adminLinks.length > 0 && (
              <div className="border-b border-slate-100 py-1 dark:border-slate-800">
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
