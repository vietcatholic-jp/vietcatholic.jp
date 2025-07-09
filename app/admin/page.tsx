import { requireRole } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  // Ensure user has admin role
  await requireRole(['regional_admin', 'super_admin']);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <AdminDashboard />
    </main>
  );
}
