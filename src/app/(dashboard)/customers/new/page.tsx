import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CreateCustomerForm from "./CreateCustomerForm";

export default async function NewCustomerPage() {
  await requirePermission(PERMISSION.CUSTOMERS_CREATE, { redirectOnForbidden: true });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <CreateCustomerForm />
    </main>
  );
}
