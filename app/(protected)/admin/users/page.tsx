import { requireRole } from "@/lib/auth";
import { AdminUsers } from "@/components/admin/admin-users";

export default async function AdminUsersPage() {
  // Allow access for regional and super admins
  await requireRole(['registration_manager', 'super_admin']);

  return <AdminUsers />;
}
