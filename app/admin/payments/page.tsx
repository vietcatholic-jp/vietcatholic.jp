import { requireRole } from "@/lib/auth";
import { AdminPayments } from "@/components/admin/admin-payments";

export default async function AdminPaymentsPage() {
  // Allow access for various admin roles
  await requireRole(['event_organizer', 'group_leader', 'regional_admin', 'super_admin']);

  return <AdminPayments />;
}
