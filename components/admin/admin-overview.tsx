"use client";

import { AnalyticsProvider, SummaryReport } from "@/components/admin/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Users, Settings, Database } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminData } from "@/components/admin/admin-context";

export function AdminOverview() {
  const router = useRouter();
  const { data } = useAdminData();
  const userRole = data?.userProfile?.role;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan quản trị</h1>
          <p className="text-muted-foreground">Bảng điều khiển chính với các chỉ số quan trọng</p>
        </div>
      </div>

      {/* Analytics Provider for Summary Report */}
      <AnalyticsProvider>
        <SummaryReport />
      </AnalyticsProvider>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Thao tác nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 gap-4 ${userRole === 'super_admin' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/admin/registrations')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Quản lý đăng ký</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/registration-manager/export')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Xuất báo cáo</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/admin/payments')}
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Quản lý đóng phí tham dự</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/admin/users')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Quản lý người dùng</span>
            </Button>

            {userRole === 'super_admin' && (
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => router.push('/admin/backup')}
              >
                <Database className="h-6 w-6" />
                <span className="text-sm">Backup & Export</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
