import { requireRole } from "@/lib/auth";
import { AdminUsers } from "@/components/admin/admin-users";

export default async function AdminUsersPage() {
  // Allow access for regional and super admins
  await requireRole(['regional_admin', 'super_admin']);

  return <AdminUsers />;
}
