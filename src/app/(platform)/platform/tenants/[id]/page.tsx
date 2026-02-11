import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import TenantInfoForm from "./TenantInfoForm";
import SubscriptionCard from "./SubscriptionCard";
import BillingHistory from "./BillingHistory";
import CreateAdminUserForm from "./CreateAdminUserForm";
import UsersList from "./UsersList";
import RecordPaymentButton from "./RecordPaymentButton";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      subscriptions: {
        include: {
          plan: true,
          payments: {
            orderBy: { dueDate: "desc" },
            take: 10,
          },
        },
        orderBy: { createdAt: "desc" },
      },
      users: {
        include: {
          role: true,
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          users: true,
          customers: true,
          tickets: true,
          visas: true,
          hajUmrahBookings: true,
          expenses: true,
          payments: true,
        },
      },
    },
  });

  if (!tenant) {
    notFound();
  }

  const activeSubscription = tenant.subscriptions.find((s) => 
    ["trial", "active"].includes(s.status)
  );

  const allPlans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <Link
            href="/platform/tenants"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tenants
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-2xl font-bold text-white shadow-lg">
              {tenant.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{tenant.name}</h1>
              <a
                href={`https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "fayohealthtech.so"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {tenant.subdomain}.{process.env.NEXT_PUBLIC_APP_DOMAIN ?? "fayohealthtech.so"}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ${
              tenant.status === "active"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                : tenant.status === "suspended"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${
              tenant.status === "active" ? "bg-emerald-500" : tenant.status === "suspended" ? "bg-amber-500" : "bg-red-500"
            }`} />
            {tenant.status}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Users", value: tenant._count.users, icon: "👥", color: "from-blue-500 to-cyan-600" },
          { label: "Customers", value: tenant._count.customers, icon: "🤝", color: "from-purple-500 to-pink-600" },
          { label: "Tickets", value: tenant._count.tickets, icon: "🎫", color: "from-emerald-500 to-teal-600" },
          { label: "Visas", value: tenant._count.visas, icon: "🛂", color: "from-amber-500 to-orange-600" },
          { label: "Bookings", value: tenant._count.hajUmrahBookings, icon: "🕋", color: "from-indigo-500 to-purple-600" },
          { label: "Payments", value: tenant._count.payments, icon: "💳", color: "from-rose-500 to-pink-600" },
        ].map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-xl shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subscription & Billing</h2>
          {activeSubscription && (
            <RecordPaymentButton 
              subscriptionId={activeSubscription.id}
              tenantName={tenant.name}
              planName={activeSubscription.plan.displayName}
              amount={Number(activeSubscription.plan.price)}
            />
          )}
        </div>
        <SubscriptionCard
          subscription={activeSubscription || null}
          tenant={tenant}
          plans={allPlans}
        />
        
        {/* Billing History */}
        {activeSubscription && activeSubscription.payments.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Payment History</h3>
            <BillingHistory payments={activeSubscription.payments} />
          </div>
        )}
      </div>

      {/* Users Management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h2>
          <CreateAdminUserForm tenantId={tenant.id} />
        </div>
        <UsersList users={tenant.users} tenantId={tenant.id} />
      </div>

      {/* Client Information */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Organization Details</h2>
        <TenantInfoForm tenant={tenant} />
      </div>
    </div>
  );
}
