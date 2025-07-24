"use client";

import { Card} from "@/components/ui/card";
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
      title: "Đã đóng phí tham dự",
      value: paidRegistrations,
      icon: DollarSign,
      description: "Đăng ký đã xác nhận",
      color: "text-emerald-600"
    },
    {
      title: "Chờ đóng phí tham dự",
      value: pendingRegistrations,
      icon: Clock,
      description: "Đăng ký chưa hoàn tất",
      color: "text-amber-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <div className={`text-lg md:text-2xl font-bold`}>
                  {stat.value.toLocaleString()}
                </div>
              </div>
              <div className={`text-xs md:text-sm font-medium text-left `}>
                {stat.title}
              </div>
          </Card>
        );
      })}
    </div>
  );
}
