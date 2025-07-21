import { requireRole } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/admin-layout";

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow access for various admin roles
  await requireRole(['event_organizer','registration_manager', 'group_leader', 'regional_admin', 'super_admin']);

  return (
    <div className="min-h-screen bg-background">
      <AdminLayout>{children}</AdminLayout>
    </div>
  );
}
