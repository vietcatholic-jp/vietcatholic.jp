import { requirePermission } from "@/lib/auth";
import { AdminUsers } from "@/components/admin/admin-users";

export default async function AdminUsersPage() {
  // Require permission to assign roles to users
  await requirePermission('users.assign_roles');

  return <AdminUsers />;
}
