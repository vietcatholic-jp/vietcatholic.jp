import { requireRole } from "@/lib/auth";
import ExportPage from "../../registration-manager/export/page";

export default async function AdminRegistrationsPage() {
  // Allow access for various admin roles
  await requireRole(['cashier_role', 'registration_staff', 'registration_manager', 'super_admin']);

  return <ExportPage />;
}
