"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminStats } from "@/components/admin/admin-stats";
import { RegistrationsList } from "@/components/admin/registrations-list";
import { ExportButton } from "@/components/admin/export-button";
import { UserManagement } from "@/components/admin/user-management";
import { EventConfigManager } from "@/components/admin/event-config-manager";
import { OrganizerTools } from "@/components/admin/organizer-tools";
import { DiocesesChart } from "@/components/admin/dioceses-chart";
import { ProvincesChart } from "@/components/admin/provinces-chart";
import { 
  Users, 
  CreditCard,
  Loader2,
  Settings,
  UserCheck,
  BarChart3,
  Wrench
} from "lucide-react";
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
  provinceStats?: { province: string; count: number }[];
  dioceseStats?: { diocese: string; count: number }[];
  roleStats?: { event_role: string; count: number }[];
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
          {/* Desktop Tab List */}
          <TabsList className="hidden md:grid w-full grid-cols-6 gap-1">
            <TabsTrigger value="overview" className="flex items-center gap-1 text-sm">
              <BarChart3 className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4" />
              Đăng ký
            </TabsTrigger>
            {(['event_organizer', 'group_leader', 'regional_admin', 'super_admin'].includes(userRole)) && (
              <TabsTrigger value="tools" className="flex items-center gap-1 text-sm">
                <Wrench className="h-4 w-4" />
                Công cụ
              </TabsTrigger>
            )}
            {(userRole === 'super_admin' || userRole === 'regional_admin') && (
              <TabsTrigger value="users" className="flex items-center gap-1 text-sm">
                <UserCheck className="h-4 w-4" />
                Người dùng
              </TabsTrigger>
            )}
            {userRole === 'super_admin' && (
              <TabsTrigger value="events" className="flex items-center gap-1 text-sm">
                <Settings className="h-4 w-4" />
                Sự kiện
              </TabsTrigger>
            )}
            <TabsTrigger value="payments" className="flex items-center gap-1 text-sm">
              <CreditCard className="h-4 w-4" />
              Thanh toán
            </TabsTrigger>
          </TabsList>

          {/* Mobile Tab List */}
          <div className="md:hidden">
            <TabsList className="grid w-full grid-cols-2 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-1 text-xs">
                <BarChart3 className="h-3 w-3" />
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="registrations" className="flex items-center gap-1 text-xs">
                <Users className="h-3 w-3" />
                Đăng ký
              </TabsTrigger>
            </TabsList>
            
            {(['event_organizer', 'group_leader', 'regional_admin', 'super_admin'].includes(userRole)) && (
              <TabsList className="grid w-full grid-cols-2 gap-1 mt-2">
                <TabsTrigger value="tools" className="flex items-center gap-1 text-xs">
                  <Wrench className="h-3 w-3" />
                  Công cụ
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-1 text-xs">
                  <CreditCard className="h-3 w-3" />
                  Thanh toán
                </TabsTrigger>
              </TabsList>
            )}
            
            {(userRole === 'super_admin' || userRole === 'regional_admin') && (
              <TabsList className="grid w-full grid-cols-1 gap-1 mt-2">
                <TabsTrigger value="users" className="flex items-center gap-1 text-xs">
                  <UserCheck className="h-3 w-3" />
                  Người dùng
                </TabsTrigger>
                {userRole === 'super_admin' && (
                  <TabsTrigger value="events" className="flex items-center gap-1 text-xs">
                    <Settings className="h-3 w-3" />
                    Sự kiện
                  </TabsTrigger>
                )}
              </TabsList>
            )}
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions - Improved with role-specific cards */}
            

            {/* Province Stats (for super admin) */}
            {data.provinceStats && (
              <ProvincesChart provinceStats={data.provinceStats} />
            )}
            {/* Diocese Stats (for super admin) */}
            {data.dioceseStats && (
              <DiocesesChart dioceseStats={data.dioceseStats} />
            )}
            {/* Event Role Stats (for super admin) */}
            {data.roleStats &&  (
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê theo vai trò</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.roleStats.map((stat) => (
                      <div key={stat.event_role} className="text-center">
                        <div className="font-semibold text-lg">{stat.count}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {stat.event_role.replace(/_/g, ' ')}
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

          {/* Organizer Tools Tab */}
          {(['event_organizer', 'group_leader', 'regional_admin', 'super_admin'].includes(userRole)) && (
            <TabsContent value="tools">
              <OrganizerTools 
                registrations={data.recentRegistrations} 
                userRole={userRole}
              />
            </TabsContent>
          )}

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
