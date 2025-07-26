import { requireRole } from "@/lib/auth";
import { AdminOverview } from "@/components/admin/admin-overview";

export default async function AdminPage() {
  // Allow access for various admin roles
  await requireRole(['event_organizer','registration_manager', 'super_admin']);

  return <AdminOverview />;
}
