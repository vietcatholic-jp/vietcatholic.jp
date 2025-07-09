import { requireRole } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  // Allow access for various admin roles
  await requireRole(['event_organizer', 'group_leader', 'regional_admin', 'super_admin']);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <AdminDashboard />
    </main>
  );
}
