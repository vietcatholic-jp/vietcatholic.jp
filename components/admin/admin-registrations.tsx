"use client";

import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { GroupLeaderRegistrations } from "@/components/admin/group-leader-registrations";
import { useAdminData } from "@/components/admin/admin-context";
import { Button } from "@/components/ui/button";
import { FileText, Filter, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminRegistrations() {
  const { data, isLoading } = useAdminData();
  const router = useRouter();

  if (isLoading || !data) {
    return null; // Loading is handled by the layout
  }

  const userRole = data.userProfile?.role || 'participant';

  // Check if user has access to Registration Manager
  const hasRegistrationManagerAccess = ['registration_manager', 'super_admin'].includes(userRole);

  // Group leaders get a specialized view
  if (userRole === 'group_leader') {
    return <GroupLeaderRegistrations />;
  }

  // Other admin roles get the detailed analytics dashboard with filters
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý đăng ký</h1>
          <p className="text-muted-foreground">Phân tích chi tiết và báo cáo đăng ký với bộ lọc</p>
        </div>
        <div className="flex items-center gap-3">
          {hasRegistrationManagerAccess && (
            <Button
              onClick={() => router.push('/registration-manager')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Quản lý đăng ký chi tiết
            </Button>
          )}
          <Button
            onClick={() => router.push('/registration-manager/export')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Filter className="h-5 w-5" />
          <span className="font-medium">Trang phân tích chi tiết</span>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Sử dụng các bộ lọc để phân tích dữ liệu theo tỉnh thành, giáo phận, size áo và trạng thái đóng phí tham dự
        </p>
      </div>
      
      <AnalyticsDashboard />
    </div>
  );
}
