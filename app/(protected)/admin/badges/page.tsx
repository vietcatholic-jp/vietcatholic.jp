import { requireRole } from "@/lib/auth";
import { BatchBadgeGenerator } from "@/components/badges/batch-badge-generator";

export default async function AdminBadgesPage() {
  // Allow access for admin roles
  await requireRole(['event_organizer', 'super_admin', 'registration_manager']);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quản lý thẻ tham dự</h1>
            <p className="text-muted-foreground mt-2">
              Tạo và tải xuống thẻ tham dự cho Đại hội Công giáo Việt Nam 2025
            </p>
          </div>
        </div>

        {/* Badge Management Component */}
        <BatchBadgeGenerator />
      </div>
    </div>
  );
}
