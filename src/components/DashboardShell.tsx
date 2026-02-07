"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import AppHeader from "./AppHeader";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  perm?: string;
};

type DashboardShellProps = {
  children: React.ReactNode;
  navItems: NavItem[];
  adminItems: { href: string; label: string }[];
  showReports?: boolean;
  userEmail: string;
  userName: string | null;
  roleName: string;
};

export default function DashboardShell({
  children,
  navItems,
  adminItems,
  showReports = true,
  userEmail,
  userName,
  roleName,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    function handleToggle() {
      setSidebarOpen((prev) => !prev);
    }
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-slate-950 dark:to-slate-900/50">
      <Sidebar
        navItems={navItems}
        adminItems={adminItems}
        showReports={showReports}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pl-72">
        <AppHeader
          userEmail={userEmail}
          userName={userName}
          roleName={roleName}
          adminLinks={adminItems}
        />
        <main className="min-h-[calc(100vh-3.5rem)] min-w-0 px-3 py-4 sm:px-4 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
