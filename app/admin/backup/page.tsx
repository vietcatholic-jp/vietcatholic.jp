import { requireRole } from "@/lib/auth";
import { BackupExport } from "@/components/admin/backup-export";

export default async function BackupPage() {
  // Only super_admin can access backup functionality
  await requireRole(['super_admin']);

  return <BackupExport />;
}