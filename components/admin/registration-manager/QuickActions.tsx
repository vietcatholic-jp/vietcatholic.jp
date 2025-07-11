"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download,
  Users,
  FileText
} from "lucide-react";

interface QuickActionsProps {
  stats: {
    total_registrations: number;
    pending_payments: number;
    confirmed_registrations: number;
    rejected_payments: number;
    cancel_requests: number;
    total_amount: number;
    confirmed_amount: number;
  };
  onTabChange: (tab: string) => void;
}

export function QuickActions({ stats, onTabChange }: QuickActionsProps) {
  const quickActionItems = [
    {
      title: "Xem đăng ký chờ xác nhận",
      description: "Xử lý các đăng ký đã báo thanh toán",
      count: stats.pending_payments,
      icon: CheckCircle,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      action: () => onTabChange("registrations"),
      disabled: stats.pending_payments === 0
    },
    {
      title: "Xử lý yêu cầu hủy",
      description: "Duyệt các yêu cầu hủy đăng ký",
      count: stats.cancel_requests,
      icon: XCircle,
      color: "bg-orange-50 text-orange-700 border-orange-200",
      action: () => onTabChange("cancellations"),
      disabled: stats.cancel_requests === 0
    },
    {
      title: "Xem thanh toán bị từ chối",
      description: "Xử lý các thanh toán bị từ chối",
      count: stats.rejected_payments,
      icon: AlertCircle,
      color: "bg-red-50 text-red-700 border-red-200",
      action: () => onTabChange("registrations"),
      disabled: stats.rejected_payments === 0
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Thao tác nhanh
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActionItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className={`p-4 h-auto justify-start ${item.disabled ? 'opacity-50' : 'hover:' + item.color}`}
                onClick={item.action}
                disabled={item.disabled}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className="h-5 w-5" />
				  <div className="flex-1 text-left">
					<div className="font-medium text-sm leading-tight">{item.title}</div>
					<div className="text-xs text-muted-foreground leading-tight">{item.description}</div>
				  </div>
                  {item.count > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {item.count}
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Export actions */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Xuất dữ liệu
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Xuất danh sách đăng ký
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Xuất báo cáo thanh toán
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
