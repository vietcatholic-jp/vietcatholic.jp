"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  UserCheck, 
  Clock, 
  DollarSign
} from "lucide-react";

interface AdminStatsProps {
  totalRegistrations: number;
  totalParticipants: number;
  paidRegistrations: number;
  pendingRegistrations: number;
}

export function AdminStats({
  totalRegistrations,
  totalParticipants,
  paidRegistrations,
  pendingRegistrations
}: AdminStatsProps) {
  const stats = [
    {
      title: "Tổng đăng ký",
      value: totalRegistrations,
      icon: Users,
      description: "Số lượng đăng ký",
      color: "text-blue-600"
    },
    {
      title: "Tổng người tham gia",
      value: totalParticipants,
      icon: UserCheck,
      description: "Tất cả người đăng ký",
      color: "text-green-600"
    },
    {
      title: "Đã thanh toán",
      value: paidRegistrations,
      icon: DollarSign,
      description: "Đăng ký đã xác nhận",
      color: "text-emerald-600"
    },
    {
      title: "Chờ thanh toán",
      value: pendingRegistrations,
      icon: Clock,
      description: "Đăng ký chưa hoàn tất",
      color: "text-amber-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
