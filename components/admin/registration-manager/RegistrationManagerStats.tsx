"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  DollarSign
} from "lucide-react";

interface RegistrationManagerStatsProps {
  stats: {
    totalRegistrations: number;
    pendingPayments: number;
    confirmedRegistrations: number;
    rejectedPayments: number;
    cancelRequests: number;
    totalAmount: number;
    confirmedAmount: number;
  };
}

export function RegistrationManagerStats({ stats }: RegistrationManagerStatsProps) {
  const statCards = [
    {
      title: "Tổng đăng ký",
      value: stats.totalRegistrations,
      icon: Users,
      variant: "default" as const,
      description: "Tổng số đăng ký"
    },
    {
      title: "Chờ thanh toán",
      value: stats.pendingPayments,
      icon: Clock,
      variant: "secondary" as const,
      description: "Cần xác nhận"
    },
    {
      title: "Đã xác nhận",
      value: stats.confirmedRegistrations,
      icon: CheckCircle,
      variant: "success" as const,
      description: "Thanh toán thành công"
    },
    {
      title: "Từ chối",
      value: stats.rejectedPayments,
      icon: XCircle,
      variant: "destructive" as const,
      description: "Thanh toán bị từ chối"
    },
    {
      title: "Yêu cầu hủy",
      value: stats.cancelRequests,
      icon: AlertCircle,
      variant: "warning" as const,
      description: "Cần xử lý"
    }
  ];
  /**
  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case "success": return "default";
      case "warning": return "secondary";
      case "destructive": return "destructive";
      default: return "outline";
    }
  };*/

  return (
    <div className="space-y-4">
      {/* Main Stats Grid - Compact for mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
              </div>
              <div className="text-xs md:text-sm font-medium text-left">
                {stat.title}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Financial Summary - Compact for mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Tổng dự kiến</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-lg md:text-2xl font-bold">
            ¥{stats.totalAmount.toLocaleString()}
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Đã thu được</span>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-lg md:text-2xl font-bold text-green-600">
            ¥{stats.confirmedAmount.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Quick Actions - Compact for mobile */}
      <Card className="p-3 md:p-4">
        <h3 className="font-medium mb-2">Cần xử lý</h3>
        <div className="flex flex-wrap gap-1">
          {stats.pendingPayments > 0 && (
            <Badge variant="secondary" className="text-xs">
              {stats.pendingPayments} thanh toán
            </Badge>
          )}
          {stats.cancelRequests > 0 && (
            <Badge variant="outline" className="text-xs">
              {stats.cancelRequests} yêu cầu hủy
            </Badge>
          )}
          {stats.rejectedPayments > 0 && (
            <Badge variant="destructive" className="text-xs">
              {stats.rejectedPayments} bị từ chối
            </Badge>
          )}
          {stats.pendingPayments === 0 && stats.cancelRequests === 0 && stats.rejectedPayments === 0 && (
            <Badge variant="default" className="text-xs">
              Không có việc cần xử lý
            </Badge>
          )}
        </div>
      </Card>
    </div>
  );
}
