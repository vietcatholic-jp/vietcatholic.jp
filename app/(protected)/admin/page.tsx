import { requireRole } from "@/lib/auth";
import { AdminOverview } from "@/components/admin/admin-overview";

export default async function AdminPage() {
  // Allow access for various admin roles
  await requireRole(['cashier_role','registration_manager', 'super_admin']);

  return <AdminOverview />;
}
