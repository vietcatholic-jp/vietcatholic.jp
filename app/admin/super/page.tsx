import { requireRole } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Users, 
  Shield, 
  Database,
  Mail,
  FileText,
  Calendar
} from "lucide-react";
import Link from "next/link";

export default async function SuperAdminPage() {
  // Ensure user has super admin role
  await requireRole(['super_admin']);

  const adminActions = [
    {
      title: "Quản lý người dùng",
      description: "Thêm, sửa, xóa người dùng và phân quyền",
      icon: Users,
      href: "/admin/super/users",
      status: "active"
    },
    {
      title: "Cấu hình hệ thống",
      description: "Cài đặt tổng quát cho ứng dụng",
      icon: Settings,
      href: "/admin/super/settings",
      status: "active"
    },
    {
      title: "Quản lý quyền truy cập",
      description: "Thiết lập quyền cho từng khu vực",
      icon: Shield,
      href: "/admin/super/permissions",
      status: "coming_soon"
    },
    {
      title: "Sao lưu dữ liệu",
      description: "Xuất dữ liệu và tạo bản sao lưu",
      icon: Database,
      href: "/admin/super/backup",
      status: "coming_soon"
    },
    {
      title: "Gửi email hàng loạt",
      description: "Thông báo tới tất cả người tham gia",
      icon: Mail,
      href: "/admin/super/email",
      status: "coming_soon"
    },
    {
      title: "Quản lý nội dung",
      description: "Chỉnh sửa thông tin sự kiện và agenda",
      icon: FileText,
      href: "/admin/super/content",
      status: "active"
    },
    {
      title: "Báo cáo thống kê",
      description: "Xem báo cáo chi tiết theo thời gian",
      icon: Calendar,
      href: "/admin/super/reports",
      status: "coming_soon"
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Quản trị tổng hệ thống</h1>
              <p className="text-muted-foreground mt-2">
                Cài đặt và quản lý nâng cao cho Đại hội Công giáo Việt Nam 2025
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">
                ← Về trang quản trị
              </Button>
            </Link>
          </div>

          {/* Warning Notice */}
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900">Cảnh báo quan trọng</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Đây là khu vực quản trị cấp cao. Mọi thay đổi có thể ảnh hưởng đến toàn bộ hệ thống. 
                    Vui lòng thực hiện các thao tác một cách cẩn thận.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminActions.map((action) => {
              const Icon = action.icon;
              const isComingSoon = action.status === 'coming_soon';
              
              return (
                <Card 
                  key={action.href} 
                  className={`hover:shadow-md transition-shadow ${isComingSoon ? 'opacity-75' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{action.title}</CardTitle>
                      </div>
                      {isComingSoon && (
                        <Badge variant="secondary" className="text-xs">
                          Sắp có
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {action.description}
                    </p>
                    {isComingSoon ? (
                      <Button disabled className="w-full">
                        Đang phát triển
                      </Button>
                    ) : (
                      <Link href={action.href}>
                        <Button className="w-full">
                          Truy cập
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Stats */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Thống kê hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">--</div>
                  <div className="text-sm text-muted-foreground">Tổng người dùng</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">--</div>
                  <div className="text-sm text-muted-foreground">Đăng ký đã xác nhận</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">--</div>
                  <div className="text-sm text-muted-foreground">Đăng ký chờ duyệt</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">--</div>
                  <div className="text-sm text-muted-foreground">Tổng doanh thu</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
