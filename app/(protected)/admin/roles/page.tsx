import { requirePermission } from "@/lib/auth";
import { RoleManagement } from "@/components/admin/role-management";

export default async function RolesPage() {
  await requirePermission('roles.*');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quản lý Vai trò & Quyền hạn</h2>
        <p className="text-muted-foreground">
          Tạo và quản lý các vai trò hệ thống với quyền hạn tùy chỉnh
        </p>
      </div>
      
      <RoleManagement />
    </div>
  );
}