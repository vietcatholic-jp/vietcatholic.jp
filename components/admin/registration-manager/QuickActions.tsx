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
  FileText,
  ExternalLink,
  Database
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface MissingRegistrant {
  id: string;
  invoice_code: string;
  status: string;
  created_at: string;
  user: {
    email: string;
    full_name?: string;
    province?: string;
    facebook_link?: string;
  };
}

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
  const router = useRouter();
  const [missingRegistrantsCount, setMissingRegistrantsCount] = useState<number | null>(null);
  const [missingRegistrations, setMissingRegistrations] = useState<MissingRegistrant[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check for registrations without registrants on component mount
  useEffect(() => {
    const checkMissingRegistrants = async () => {
      try {
        const response = await fetch('/api/admin/fix-registrants');
        if (response.ok) {
          const result = await response.json();
          setMissingRegistrantsCount(result.count);
        }
      } catch (error) {
        console.error('Error checking missing registrants:', error);
      }
    };

    checkMissingRegistrants();
  }, []);

  const handleShowMissingRegistrants = async () => {
    if (showDetails) {
      setShowDetails(false);
      return;
    }

    setIsLoadingDetails(true);
    try {
      const response = await fetch('/api/admin/fix-registrants');
      if (!response.ok) {
        throw new Error('Failed to fetch missing registrants');
      }
      
      const result = await response.json();
      
      if (result.registrations) {
        setMissingRegistrations(result.registrations);
        setShowDetails(true);
      } else {
        toast.info('ℹ️ Không có đăng ký nào thiếu thông tin người tham gia');
      }
    } catch (error) {
      console.error('Error fetching missing registrants:', error);
      toast.error('❌ Lỗi khi tải danh sách: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleExport = (type: 'registrations' | 'payments') => {
    // Navigate to export page with pre-selected filters based on type
    const params = new URLSearchParams();
    if (type === 'payments') {
      params.set('filter', 'payment-focused');
    }
    router.push(`/registration-manager/export?${params.toString()}`);
  };

  const quickActionItems = [
    {
      title: "Xem đăng ký chờ xác nhận",
      description: "Xử lý các đăng ký đã báo đóng phí tham dự",
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
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => handleExport('registrations')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Xuất danh sách đăng ký
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => handleExport('payments')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Xuất báo cáo thanh toán
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </div>
        </div>

        {/* Data Maintenance */}
        {missingRegistrantsCount !== null && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Bảo trì dữ liệu
            </h4>
            
            {missingRegistrantsCount > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-medium text-amber-800 mb-1">
                      Phát hiện {missingRegistrantsCount} đăng ký thiếu thông tin người tham gia
                    </h5>
                    <p className="text-sm text-amber-700 mb-3">
                      Các đăng ký này cần người tham gia cập nhật thông tin. Hãy liên hệ với họ để hướng dẫn.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleShowMissingRegistrants}
                      disabled={isLoadingDetails}
                      variant="outline"
                      className="border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {isLoadingDetails ? 'Đang tải...' : (showDetails ? 'Ẩn danh sách' : 'Xem danh sách')}
                    </Button>
                  </div>
                </div>
                
                {/* List of registrations */}
                {showDetails && missingRegistrations.length > 0 && (
                  <div className="mt-4 border-t border-amber-200 pt-4">
                    <h6 className="font-medium text-amber-800 mb-3">
                      Danh sách đăng ký cần liên hệ:
                    </h6>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {missingRegistrations.map((reg) => (
                        <div
                          key={reg.id}
                          className="bg-white border border-amber-200 rounded-lg p-3 text-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {reg.user?.full_name || 'Tên chưa cập nhật'}
                              </div>
                              <div className="text-gray-600 mt-1">
                                📧 {reg.user?.email}
                              </div>
                              <div className="text-gray-600 mt-1">
                                {reg.user?.facebook_link && (
                                  <a 
                                    href={reg.user.facebook_link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {reg.user.facebook_link}
                                  </a>
                                )}
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                📋 Mã: {reg.invoice_code} • 
                                📅 {new Date(reg.created_at).toLocaleDateString('vi-VN')} •
                                🏷️ {reg.status}
                              </div>
                              {reg.user?.province && (
                                <div className="text-gray-500 text-xs">
                                  📍 {reg.user.province}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const editUrl = `/register/${reg.id}`;
                                navigator.clipboard.writeText(`${window.location.origin}${editUrl}`);
                                toast.success('📋 Đã copy link chỉnh sửa vào clipboard');
                              }}
                              className="text-xs"
                            >
                              📋 Copy link
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                      💡 <strong>Hướng dẫn:</strong> Liên hệ với từng người qua facebook(email), gửi cho họ link chỉnh sửa để họ tự cập nhật thông tin đầy đủ.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Tất cả đăng ký đều có thông tin người tham gia đầy đủ
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
