import { requireRole } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AdminLayout } from "@/components/admin/admin-layout";

export default async function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow access for various admin roles
  await requireRole(['event_organizer', 'group_leader', 'regional_admin', 'super_admin']);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <AdminLayout>{children}</AdminLayout>
    </main>
  );
}
