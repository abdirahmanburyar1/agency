"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  perm?: string;
};

type SidebarProps = {
  navItems: NavItem[];
  adminItems: { href: string; label: string }[];
  showDashboard?: boolean;
  showReports?: boolean;
  homeHref?: string;
  isOpen: boolean;
  onClose: () => void;
  systemName?: string;
  logoUrl?: string;
};

const ICON_COLORS: Record<string, string> = {
  dashboard: "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400",
  reports: "bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400",
  tickets: "bg-sky-500/15 text-sky-600 dark:bg-sky-400/20 dark:text-sky-400",
  visas: "bg-teal-500/15 text-teal-600 dark:bg-teal-400/20 dark:text-teal-400",
  haj_umrah: "bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400",
  customers: "bg-violet-500/15 text-violet-600 dark:bg-violet-400/20 dark:text-violet-400",
  expenses: "bg-orange-500/15 text-orange-600 dark:bg-orange-400/20 dark:text-orange-400",
  receivables: "bg-green-500/15 text-green-600 dark:bg-green-400/20 dark:text-green-400",
  payables: "bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-400",
  payments: "bg-indigo-500/15 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-400",
  cargo: "bg-amber-600/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  settings: "bg-slate-500/15 text-slate-600 dark:bg-slate-400/20 dark:text-slate-400",
  users: "bg-cyan-500/15 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-400",
  roles: "bg-fuchsia-500/15 text-fuchsia-600 dark:bg-fuchsia-400/20 dark:text-fuchsia-400",
  platform: "bg-violet-500/15 text-violet-600 dark:bg-violet-400/20 dark:text-violet-400",
};

const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  tickets: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  visas: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  haj_umrah: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  customers: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  expenses: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5 3.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  ),
  receivables: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  payables: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  payments: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  cargo: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  settings: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  roles: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  reports: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  platform: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
};

function NavLink({
  href,
  label,
  iconKey,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  iconKey: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const colorClass = ICON_COLORS[iconKey] ?? ICON_COLORS.dashboard;
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "border-l-4 border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-100"
          : "border-l-4 border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          isActive ? "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-400/25 dark:text-emerald-300" : colorClass
        }`}
      >
        {ICONS[iconKey] ?? ICONS.dashboard}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar({ navItems, adminItems, showDashboard = true, showReports = true, homeHref = "/", isOpen, onClose, systemName = "Daybah Travel Agency", logoUrl = "/logo.png" }: SidebarProps) {
  const pathname = usePathname();
  const [adminExpanded, setAdminExpanded] = useState(false);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 transform bg-white shadow-xl transition-all duration-300 ease-out print:hidden dark:bg-slate-900 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-700/80">
            <Link href={homeHref} className="flex items-center justify-center" onClick={onClose}>
              <img
                src={logoUrl}
                alt={systemName}
                className="h-10 w-auto max-w-[160px] object-contain"
              />
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-4 py-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Main
            </p>
            <ul className="space-y-1">
              {showDashboard && (
                <li>
                  <NavLink href="/" label="Dashboard" iconKey="dashboard" isActive={pathname === "/"} onClick={onClose} />
                </li>
              )}
              {showReports && (
                <li>
                  <NavLink href="/reports" label="Reports" iconKey="reports" isActive={pathname === "/reports"} onClick={onClose} />
                </li>
              )}
            </ul>

            <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Operations
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href) && item.href !== "/";
                return (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      label={item.label}
                      iconKey={item.icon}
                      isActive={!!isActive}
                      onClick={onClose}
                    />
                  </li>
                );
              })}
            </ul>

            {adminItems.length > 0 && (
              <>
                <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Administration
                </p>
                <ul className="space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => setAdminExpanded(!adminExpanded)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-3">
                        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${ICON_COLORS.settings}`}>
                          {ICONS.settings}
                        </span>
                        <span>Admin</span>
                      </span>
                      <svg
                        className={`size-4 text-slate-400 transition-transform duration-200 ${adminExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {adminExpanded && (
                      <ul className="mt-1 space-y-1 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
                        {adminItems.map((item) => {
                          const isActive = pathname.startsWith(item.href);
                          const iconKey = item.label === "Settings" ? "settings" : item.label === "Users" ? "users" : item.label === "Platform" ? "platform" : "roles";
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                                  isActive
                                    ? "font-medium text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                                onClick={onClose}
                              >
                                <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${ICON_COLORS[iconKey] ?? ICON_COLORS.settings}`}>
                                  {ICONS[iconKey] ?? ICONS.settings}
                                </span>
                                {item.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                </ul>
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}
