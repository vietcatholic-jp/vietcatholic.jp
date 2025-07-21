import { requireRole } from "@/lib/auth";
import { AdminTransportation } from "@/components/admin/admin-transportation";

export default async function AdminTransportationPage() {
  // Allow access for regional and super admins
  await requireRole(['regional_admin', 'super_admin']);

  return <AdminTransportation />;
}
