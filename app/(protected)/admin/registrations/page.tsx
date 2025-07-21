import { requireRole } from "@/lib/auth";
import { AdminRegistrations } from "@/components/admin/admin-registrations";

export default async function AdminRegistrationsPage() {
  // Allow access for various admin roles
  await requireRole(['event_organizer', 'group_leader', 'regional_admin', 'super_admin']);

  return <AdminRegistrations />;
}
