"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStats } from "@/components/admin/admin-stats";
import { RegistrationsList } from "@/components/admin/registrations-list";
import { ExportButton } from "@/components/admin/export-button";
import { UserManagement } from "@/components/admin/user-management";
import { EventConfigManager } from "@/components/admin/event-config-manager";
import { 
  Users, 
  FileText, 
  CreditCard,
  Loader2,
  Settings,
  UserCheck,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Registration, UserRole, RegionType } from "@/lib/types";

interface AdminData {
  stats: {
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    totalParticipants: number;
  };
  recentRegistrations: Registration[];
  regionalStats?: { region: string; count: number }[];
  userProfile?: {
    role: UserRole;
    region?: RegionType;
  };
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await fetch('/api/admin');
        if (!response.ok) {
          throw new Error('Failed to fetch admin data');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load admin data</p>
        </div>
      </div>
    );
  }

  const userRole = data.userProfile?.role || 'participant';
  const userRegion = data.userProfile?.region;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quản trị hệ thống</h1>
            <p className="text-muted-foreground mt-2">
              Quản lý Đại hội Công giáo Việt Nam 2025 - {userRole === 'super_admin' ? 'Quản trị viên' : 'Quản trị viên khu vực'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ExportButton registrations={data.recentRegistrations} />
          </div>
        </div>

        {/* Statistics */}
        <AdminStats
          totalRegistrations={data.stats.totalRegistrations}
          totalParticipants={data.stats.totalParticipants}
          paidRegistrations={data.stats.confirmedRegistrations}
          pendingRegistrations={data.stats.pendingRegistrations}
        />

        {/* Role-based Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Đăng ký
            </TabsTrigger>
            {(userRole === 'super_admin' || userRole === 'regional_admin') && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Người dùng
              </TabsTrigger>
            )}
            {userRole === 'super_admin' && (
              <TabsTrigger value="events" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Sự kiện
              </TabsTrigger>
            )}
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Thanh toán
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Quản lý đăng ký
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Xem và quản lý tất cả đăng ký
                  </p>
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => {
                      const tabsElement = document.querySelector('[data-state="active"][value="registrations"]');
                      if (tabsElement) {
                        (tabsElement as HTMLElement).click();
                      }
                    }}
                  >
                    Xem danh sách
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Xác nhận thanh toán
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Duyệt hóa đơn thanh toán
                  </p>
                  <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      const tabsElement = document.querySelector('[data-state="active"][value="payments"]');
                      if (tabsElement) {
                        (tabsElement as HTMLElement).click();
                      }
                    }}
                  >
                    Duyệt thanh toán
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Quản lý chương trình
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Cập nhật chương trình sự kiện
                  </p>
                  <Link href="/agenda">
                    <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700">
                      Quản lý agenda
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Regional Stats (for super admin) */}
            {data.regionalStats && userRole === 'super_admin' && (
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê theo khu vực</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.regionalStats.map((stat: { region: string; count: number }) => (
                      <div key={stat.region} className="text-center">
                        <div className="font-semibold text-lg">{stat.count}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {stat.region.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <RegistrationsList 
              registrations={data.recentRegistrations} 
              userRole={userRole}
            />
          </TabsContent>

          {/* User Management Tab */}
          {(userRole === 'super_admin' || userRole === 'regional_admin') && (
            <TabsContent value="users">
              <UserManagement 
                currentUserRole={userRole}
                currentUserRegion={userRegion}
              />
            </TabsContent>
          )}

          {/* Event Configuration Tab */}
          {userRole === 'super_admin' && (
            <TabsContent value="events">
              <EventConfigManager currentUserRole={userRole} />
            </TabsContent>
          )}

          {/* Payment Management Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Quản lý thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tính năng quản lý thanh toán sẽ được triển khai trong phiên bản tiếp theo.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
