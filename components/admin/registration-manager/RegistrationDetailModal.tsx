"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Registration, Registrant } from "@/lib/types";

interface RegistrantWithRole extends Omit<Registrant, 'event_role'> {
  event_role?: {
    id: string;
    name: string;
    team_name: string;
    description?: string;
  };
}

import { 
  User, 
  Users, 
  CreditCard,
  FileText,
  Receipt,
  ExternalLink
} from "lucide-react";
import Image from "next/image";
import { RoleBadgeCompact } from "@/components/ui/role-badge";

interface RegistrationDetailModalProps {
  registration: Registration;
  onClose: () => void;
}

export function RegistrationDetailModal({ registration, onClose }: RegistrationDetailModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Chờ thanh toán</Badge>;
      case 'report_paid':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Đã báo thanh toán</Badge>;
      case 'confirm_paid':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Đã xác nhận thanh toán</Badge>;
      case 'payment_rejected':
        return <Badge variant="destructive">Thanh toán bị từ chối</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500">Đã xác nhận</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
      case 'cancel_pending':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Chờ xác nhận hủy</Badge>;
      case 'cancel_accepted':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Đã chấp nhận hủy</Badge>;
      case 'cancel_rejected':
        return <Badge variant="destructive">Đã từ chối hủy</Badge>;
      case 'cancel_processed':
        return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">Đã hoàn tiền</Badge>;
      case 'donation':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">Đã chuyển thành quyên góp</Badge>;
      case 'checked_in':
        return <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200">Đã check-in</Badge>;
      case 'checked_out':
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">Đã check-out</Badge>;
      case 'temp_confirmed':
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">Đã xác nhận (thanh toán sau)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw] md:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="text-sm md:text-base">Chi tiết #{registration.invoice_code}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Registration Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Thông tin đăng ký
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="text-sm text-muted-foreground">Trạng thái:</span>
                  <div className="mt-1">{getStatusBadge(registration.status)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Số người:</span>
                  <div className="mt-1 font-medium">{registration.participant_count}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tổng chi phí:</span>
                  <div className="mt-1 font-medium text-lg">¥{registration.total_amount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Ngày đăng ký:</span>
                  <div className="mt-1 text-sm">{new Date(registration.created_at).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
              {registration.notes && (
                <div className="border-t pt-3">
                  <span className="text-sm text-muted-foreground">Ghi chú:</span>
                  <p className="mt-1 text-sm">{registration.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin người đăng ký
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Họ tên:</span>
                  <div className="mt-1 font-medium">{registration.user?.full_name || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <div className="mt-1">{registration.user?.email}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Khu vực:</span>
                  <div className="mt-1">{registration.user?.region || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Tỉnh/Thành:</span>
                  <div className="mt-1">{registration.user?.province || 'N/A'}</div>
                </div>
                {registration.user?.facebook_url && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Facebook:</span>
                    <div className="mt-1">
                      <a 
                        href={registration.user.facebook_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {registration.user.facebook_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Participants List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Danh sách người tham gia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(registration.registrants as RegistrantWithRole[])?.map((registrant, index) => (
                  <div key={registrant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{registrant.full_name}</span>
                        {registrant.saint_name && (
                          <span className="text-muted-foreground">({registrant.saint_name})</span>
                        )}
                        {registrant.is_primary && (
                          <Badge variant="default" className="text-xs">Người chính</Badge>
                        )}
                        {registrant.second_day_only && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                            Chỉ ngày 15/09
                          </Badge>
                        )}
                      </div>
                      <RoleBadgeCompact role={registrant.event_roles} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Giới tính:</span>
                        <span className="ml-2">{registrant.gender === 'male' ? 'Nam' : registrant.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Nhóm tuổi:</span>
                        <span className="ml-2">{registrant.age_group}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Size áo:</span>
                        <span className="ml-2">{registrant.shirt_size}</span>
                      </div>
                      {registrant.phone && (
                        <div>
                          <span className="text-muted-foreground">Điện thoại:</span>
                          <span className="ml-2">{registrant.phone}</span>
                        </div>
                      )}
                      {registrant.province && (
                        <div>
                          <span className="text-muted-foreground">Tỉnh/Thành:</span>
                          <span className="ml-2">{registrant.province}</span>
                        </div>
                      )}
                      {registrant.diocese && (
                        <div>
                          <span className="text-muted-foreground">Giáo phận:</span>
                          <span className="ml-2">{registrant.diocese}</span>
                        </div>
                      )}
                    </div>
                    {registrant.facebook_link && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Facebook:</span>
                        <a 
                          href={registrant.facebook_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          {registrant.facebook_link}
                        </a>
                      </div>
                    )}
                    {registrant.notes && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Ghi chú:</span>
                        <p className="ml-2">{registrant.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Receipts */}
          {registration.receipts && registration.receipts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Biên lai thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {registration.receipts.map((receipt, index) => {
                    
                    return (
                      <div key={receipt.id || index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium">{receipt.file_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Tải lên: {new Date(receipt.uploaded_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          <a
                            href={receipt.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Mở file
                          </a>
                        </div>
                        
                        <div className="mt-3">
                          <Image
                            src={receipt.file_path}
                            alt={receipt.file_name}
                            width={300}
                            height={800}
                            className="object-fill w-full h-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
