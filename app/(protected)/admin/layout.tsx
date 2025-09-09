import { requireRole } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/admin-layout";

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow access for various admin roles
  await requireRole(['registration_manager', 'super_admin','cashier_role']);

  return (
    <div className="min-h-screen bg-background">
      <AdminLayout>{children}</AdminLayout>
    </div>
  );
}
