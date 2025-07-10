import { requireRole } from "@/lib/auth";
import { AdminTools } from "@/components/admin/admin-tools";

export default async function AdminToolsPage() {
  // Allow access for various admin roles
  await requireRole(['event_organizer', 'group_leader', 'regional_admin', 'super_admin']);

  return <AdminTools />;
}
