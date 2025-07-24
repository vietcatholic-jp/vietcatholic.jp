import { requirePermission } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/admin-layout";

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require admin dashboard access permission
  await requirePermission('admin.dashboard.view');

  return (
    <div className="min-h-screen bg-background">
      <AdminLayout>{children}</AdminLayout>
    </div>
  );
}
