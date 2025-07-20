"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Registration, Registrant } from "@/lib/types";
import { 
  User, 
  Users, 
  CreditCard,
  FileText,
  Receipt,
  ExternalLink
} from "lucide-react";

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
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Chờ hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      'participant': 'Người tham gia',
      // Media team roles
      'volunteer_media_leader': 'Trưởng ban Truyền thông',
      'volunteer_media_sub_leader': 'Phó ban Truyền thông',
      'volunteer_media_member': 'Thành viên ban Truyền thông',
      // Activity team roles
      'volunteer_activity_leader': 'Trưởng ban Sinh hoạt',
      'volunteer_activity_sub_leader': 'Phó ban Sinh hoạt',
      'volunteer_activity_member': 'Thành viên ban Sinh hoạt',
      // Discipline team roles
      'volunteer_discipline_leader': 'Trưởng ban Kỷ luật',
      'volunteer_discipline_sub_leader': 'Phó ban Kỷ luật',
      'volunteer_discipline_member': 'Thành viên ban Kỷ luật',
      // Logistics team roles
      'volunteer_logistics_leader': 'Trưởng ban Hậu cần',
      'volunteer_logistics_sub_leader': 'Phó ban Hậu cần',
      'volunteer_logistics_member': 'Thành viên ban Hậu cần',
      // Liturgy team roles
      'volunteer_liturgy_leader': 'Trưởng ban Phụng vụ',
      'volunteer_liturgy_sub_leader': 'Phó ban Phụng vụ',
      'volunteer_liturgy_member': 'Thành viên ban Phụng vụ',
      // Security team roles
      'volunteer_security_leader': 'Trưởng ban An ninh',
      'volunteer_security_sub_leader': 'Phó ban An ninh',
      'volunteer_security_member': 'Thành viên ban An ninh',
      // Registration team roles
      'volunteer_registration_leader': 'Trưởng ban Thư ký',
      'volunteer_registration_sub_leader': 'Phó ban Thư ký',
      'volunteer_registration_member': 'Thành viên ban Thư ký',
      // Catering team roles
      'volunteer_catering_leader': 'Trưởng ban Ẩm thực',
      'volunteer_catering_sub_leader': 'Phó ban Ẩm thực',
      'volunteer_catering_member': 'Thành viên ban Ẩm thực',
      // Health team roles
      'volunteer_health_leader': 'Trưởng ban Y tế',
      'volunteer_health_sub_leader': 'Phó ban Y tế',
      'volunteer_health_member': 'Thành viên ban Y tế',
      // Audio Light team roles
      'volunteer_audio_light_leader': 'Trưởng ban Âm thanh Ánh sáng',
      'volunteer_audio_light_sub_leader': 'Phó ban Âm thanh Ánh sáng',
      'volunteer_audio_light_member': 'Thành viên ban Âm thanh Ánh sáng',
      // Group leadership roles
      'volunteer_group_leader': 'Trưởng nhóm các đội',
      'volunteer_group_sub_leader': 'Phó trưởng nhóm các đội',
      // Organizer roles
      'organizer_core': 'Ban Tổ chức chính',
      'organizer_regional': 'Ban Tổ chức khu vực',
      // Special roles
      'speaker': 'Diễn giả',
      'performer': 'Ban sinh hoạt',
    };
    
    return roleLabels[role] || role;
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
                {registration.registrants?.map((registrant: Registrant, index: number) => (
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
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getRoleBadge(registrant.event_role || 'participant')}
                      </Badge>
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
                    const isImage = receipt.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    
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
                        
                        {isImage && (
                          <div className="mt-3">
                            <img
                              src={receipt.file_path}
                              alt={receipt.file_name}
                              className="max-w-full h-auto max-h-64 object-contain border rounded-md"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
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
