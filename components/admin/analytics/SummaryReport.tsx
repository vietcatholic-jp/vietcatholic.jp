"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, CheckCircle, Clock, AlertTriangle, UserCheck } from "lucide-react";
import { useAnalytics } from "./AnalyticsProvider";
import { calculateSummaryStats, formatCurrency, getStatusLabel } from "./AnalyticsUtils";
import { format } from "date-fns";

export function SummaryReport() {
  const { filteredRegistrations, loading } = useAnalytics();
  
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Main stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Check-in stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={`checkin-${i}`} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = calculateSummaryStats(filteredRegistrations);

  const summaryCards = [
    {
      title: "Tổng đăng ký",
      value: stats.totalRegistrations,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Tổng người tham gia dự kiến",
      value: stats.totalParticipants,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Đăng ký đã xác nhận",
      value: stats.confirmedRegistrations,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Số người đã xác nhận",
      value: stats.confirmedRegistrants,
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Chờ thanh toán",
      value: stats.pendingPayments,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Đã báo thanh toán",
      value: stats.reportedPayments,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Thanh toán bị từ chối",
      value: stats.rejectedPayments,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Tổng số tiền đã nhận",
      value: formatCurrency(stats.totalAmount),
      icon: CreditCard,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      isAmount: true
    }
  ];

  // Check-in statistics cards
  const checkInCards = [
    {
      title: "Tổng đã check-in",
      value: stats.totalCheckedIn,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Chờ check-in",
      value: stats.waitingCheckIn,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className={`text-2xl font-bold ${card.color}`}>
                      {card.isAmount ? card.value : typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Check-in Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checkInCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={`checkin-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className={`text-2xl font-bold ${card.color}`}>
                      {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Registration Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phân tích loại đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.individualCount}</div>
              <div className="text-sm text-muted-foreground">Đăng ký riêng</div>
              <div className="text-xs text-muted-foreground mt-1">
                Người tự đăng ký di chuyển tự do
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.goWithCount}</div>
              <div className="text-sm text-muted-foreground">Đi cùng</div>
              <div className="text-xs text-muted-foreground mt-1">
                Người đăng ký có nhu cầu đi xe bus chung
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.totalRegistrants}</div>
              <div className="text-sm text-muted-foreground">Tổng cộng</div>
              <div className="text-xs text-muted-foreground mt-1">
                Tất cả người tham gia
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRegistrations.slice(0, 5).map((registration) => (
              <div key={registration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="font-mono text-sm bg-white px-2 py-1 rounded">
                    {registration.invoice_code}
                  </div>
                  <div>
                    <div className="font-medium">{registration.user?.full_name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">
                      {registration.participant_count} người • {format(new Date(registration.created_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    ['confirm_paid', 'confirmed', 'checked_in'].includes(registration.status) ? 'default' :
                    registration.status === 'pending' ? 'outline' :
                    registration.status === 'report_paid' ? 'secondary' : 'destructive'
                  }>
                    {getStatusLabel(registration.status)}
                  </Badge>
                  <div className="text-sm font-medium">
                    {formatCurrency(registration.total_amount)}
                  </div>
                </div>
              </div>
            ))}
            {filteredRegistrations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Không có dữ liệu phù hợp với bộ lọc
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}