"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  DollarSign,
  UserCheck
} from "lucide-react";

interface RegistrationManagerStatsProps {
  stats: {
    total_registrations: number;
    pending_payments: number;
    confirmed_registrations: number;
    rejected_payments: number;
    cancel_requests: number;
    total_amount: number;
    confirmed_amount: number;
    total_participants: number;
    checked_in_participants: number;
  };
}

export function RegistrationManagerStats({ stats }: RegistrationManagerStatsProps) {
  const statCards = [
    {
      title: "Tổng đăng ký",
      value: stats.total_registrations,
      icon: Users,
      variant: "default" as const,
      description: "Tổng số đăng ký",
      priority: false
    },
    {
      title: "Tổng người tham gia dự kiến",
      value: stats.total_participants,
      icon: Users,
      variant: "default" as const,
      description: "Tổng số người đăng ký",
      priority: false
    },
    {
      title: "Số người đã check-in",
      value: stats.checked_in_participants,
      icon: UserCheck,
      variant: "success" as const,
      description: "Đã có mặt tại sự kiện",
      priority: false
    },
    {
      title: "Chờ xác nhận đóng phí tham dự",
      value: stats.pending_payments,
      icon: Clock,
      variant: "secondary" as const,
      description: "Cần xác nhận",
      priority: stats.pending_payments > 0
    },
    {
      title: "Đã xác nhận",
      value: stats.confirmed_registrations,
      icon: CheckCircle,
      variant: "success" as const,
      description: "Thanh toán thành công",
      priority: false
    },
    {
      title: "Từ chối",
      value: stats.rejected_payments,
      icon: XCircle,
      variant: "destructive" as const,
      description: "Thanh toán bị từ chối",
      priority: stats.rejected_payments > 0
    },
    {
      title: "Yêu cầu hủy",
      value: stats.cancel_requests,
      icon: AlertCircle,
      variant: "warning" as const,
      description: "Cần xử lý",
      priority: stats.cancel_requests > 0
    }
  ];

  const priorityItems = statCards.filter(card => card.priority);

  return (
    <div className="space-y-4">
      {/* Priority Alert */}
      {priorityItems.length > 0 && (
        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Cần xử lý ưu tiên</h3>
          </div>
          <div className="space-y-1">
            {priorityItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-orange-700">{item.title}</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  {item.value}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 md:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`p-3 md:p-4 ${stat.priority ? 'border-orange-200 bg-orange-50' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <Icon className={`h-4 w-4 ${stat.priority ? 'text-orange-600' : 'text-muted-foreground'}`} />
                <div className={`text-lg md:text-2xl font-bold ${stat.priority ? 'text-orange-900' : ''}`}>
                  {stat.value}
                </div>
              </div>
              <div className={`text-xs md:text-sm font-medium text-left ${stat.priority ? 'text-orange-700' : ''}`}>
                {stat.title}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Tổng dự kiến</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-lg md:text-2xl font-bold">
            ¥{stats.total_amount.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            Tổng số tiền từ tất cả đăng ký
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Đã thu</span>
            <DollarSign className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-lg md:text-2xl font-bold text-green-600">
            ¥{stats.confirmed_amount.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.total_amount > 0 ? 
              `${Math.round((stats.confirmed_amount / stats.total_amount) * 100)}% của tổng dự kiến` : 
              'Chưa có doanh thu'
            }
          </div>
        </Card>
      </div>
    </div>
  );
}
