import { requireRole } from "@/lib/auth";
import { AdminEvents } from "@/components/admin/admin-events";

export default async function AdminEventsPage() {
  // Allow access for super admins only
  await requireRole(['super_admin']);

  return <AdminEvents />;
}
