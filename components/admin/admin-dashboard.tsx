"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStats } from "@/components/admin/admin-stats";
import { RegistrationsList } from "@/components/admin/registrations-list";
import { ExportButton } from "@/components/admin/export-button";
import { 
  Users, 
  FileText, 
  CreditCard,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Registration } from "@/lib/types";

interface AdminData {
  stats: {
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    totalParticipants: number;
  };
  recentRegistrations: Registration[];
  regionalStats?: { region: string; count: number }[];
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Quản trị hệ thống</h1>
            <p className="text-muted-foreground mt-2">
              Quản lý đăng ký Đại hội Công giáo Việt Nam 2025
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              <Link href="#registrations">
                <button className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90">
                  Xem danh sách
                </button>
              </Link>
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
              <Link href="#payments">
                <button className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                  Duyệt thanh toán
                </button>
              </Link>
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
                <button className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  Quản lý agenda
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Regional Stats (for super admin) */}
        {data.regionalStats && (
          <Card className="mb-8">
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

        {/* Recent Registrations */}
        <section id="registrations">
          <RegistrationsList registrations={data.recentRegistrations} userRole="super_admin" />
        </section>
      </div>
    </div>
  );
}
