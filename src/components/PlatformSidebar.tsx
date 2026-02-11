"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  description?: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/platform",
    icon: "📊",
    description: "Overview & Analytics",
  },
  {
    label: "Tenants",
    href: "/platform/tenants",
    icon: "🏢",
    description: "Manage Organizations",
  },
  {
    label: "Subscription Plans",
    href: "/platform/subscription-plans",
    icon: "💎",
    description: "Pricing & Features",
  },
  {
    label: "Subscriptions",
    href: "/platform/subscriptions",
    icon: "📋",
    description: "Active Subscriptions",
  },
  {
    label: "Payments",
    href: "/platform/payments",
    icon: "💳",
    description: "Payment History",
  },
  {
    label: "Analytics",
    href: "/platform/analytics",
    icon: "📈",
    description: "Reports & Insights",
  },
  {
    label: "Settings",
    href: "/platform/settings",
    icon: "⚙️",
    description: "Platform Configuration",
  },
];

export default function PlatformSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white shadow-lg">
                P
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                  Platform Admin
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control Center
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-2xl">{item.icon}</span>
                {!collapsed && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p
                        className={`text-xs ${
                          isActive
                            ? "text-emerald-100"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
                {collapsed && (
                  <div className="absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white shadow-xl group-hover:block dark:bg-slate-700">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs text-slate-300">{item.description}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Quick Actions */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-600 hover:to-indigo-700"
            >
              <span>🏠</span>
              <span>Go to Dashboard</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Spacer for content */}
      <div className={collapsed ? "w-20" : "w-72"} />
    </>
  );
}
