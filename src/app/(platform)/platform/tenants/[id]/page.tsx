import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import TenantInfoForm from "./TenantInfoForm";
import SubscriptionCard from "./SubscriptionCard";
import BillingHistory from "./BillingHistory";
import CreateAdminUserForm from "./CreateAdminUserForm";
import UsersList from "./UsersList";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/platform/tenants"
            className="mb-2 inline-flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← Back to Tenants
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{tenant.name}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            <a
              href={`https://${tenant.subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "fayohealthtech.so"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {tenant.subdomain}.{process.env.NEXT_PUBLIC_APP_DOMAIN ?? "fayohealthtech.so"}
            </a>
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-4 py-1.5 text-sm font-medium ${
            tenant.status === "active"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
              : tenant.status === "suspended"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {tenant.status}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Users</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.users}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Customers</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.customers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Tickets</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.tickets}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Visas</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.visas}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Bookings</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.hajUmrahBookings}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Payments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.payments}</p>
        </div>
      </div>

      {/* Subscription Section */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Subscription</h2>
        <SubscriptionCard
          subscription={activeSubscription || null}
          tenant={tenant}
          plans={allPlans}
        />
      </div>

      {/* Billing History */}
      {activeSubscription && (
        <div>
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Billing History</h2>
          <BillingHistory payments={activeSubscription.payments} />
        </div>
      )}

      {/* Users Management */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Users</h2>
          <CreateAdminUserForm tenantId={tenant.id} />
        </div>
        <UsersList users={tenant.users} />
      </div>

      {/* Client Information */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Client Information</h2>
        <TenantInfoForm tenant={tenant} />
      </div>
    </div>
  );
}
