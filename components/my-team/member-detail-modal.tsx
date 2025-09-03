"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  User,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Edit
} from "lucide-react";
import { MemberDetailModalProps } from "@/lib/types/team-management";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="default" className="text-sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          Đã xác nhận
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="text-sm">
          <Clock className="h-4 w-4 mr-2" />
          Chờ xử lý
        </Badge>
      );
    case 'report_paid':
      return (
        <Badge variant="outline" className="text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          Báo đã thanh toán
        </Badge>
      );
    case 'confirm_paid':
      return (
        <Badge variant="default" className="text-sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          Xác nhận thanh toán
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          Không xác định
        </Badge>
      );
  }
};

const getGenderText = (gender: string) => {
  return gender === 'male' ? 'Nam' : 'Nữ';
};

const getAgeGroupText = (ageGroup: string) => {
  switch (ageGroup) {
    case 'under_18':
      return 'Dưới 18 tuổi';
    case '18_25':
      return '18-25 tuổi';
    case '26_35':
      return '26-35 tuổi';
    case '36_50':
      return '36-50 tuổi';
    case 'over_50':
      return 'Trên 50 tuổi';
    default:
      return 'Không xác định';
  }
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function MemberDetailModal({ member, isOpen, onClose, onEdit }: MemberDetailModalProps) {
  if (!member) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(member);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              <span className="text-primary">{getInitials(member.full_name)}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{member.full_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {member.is_primary && (
                  <Badge variant="default" className="text-xs">Người đại diện</Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {getGenderText(member.gender)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {getAgeGroupText(member.age_group)}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Information */}
          {member.event_role && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Vai trò
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <Badge variant="secondary" className="text-sm mb-2">
                  {member.event_role.name}
                </Badge>
                {member.event_role.description && (
                  <p className="text-sm text-muted-foreground">
                    {member.event_role.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Thông tin liên lạc
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{member.province}</p>
                  <p className="text-sm text-muted-foreground">{member.diocese}</p>
                </div>
              </div>

              {member.email ? (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-50">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">Chưa cung cấp</p>
                  </div>
                </div>
              )}

              {member.phone ? (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Số điện thoại</p>
                    <p className="text-sm text-muted-foreground">{member.phone}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-50">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Số điện thoại</p>
                    <p className="text-sm text-muted-foreground">Chưa cung cấp</p>
                  </div>
                </div>
              )}

              {member.facebook_link ? (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Facebook className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Facebook</p>
                    <a 
                      href={member.facebook_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Xem trang Facebook
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-50">
                  <Facebook className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Facebook</p>
                    <p className="text-sm text-muted-foreground">Chưa cung cấp</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Information */}
          {member.registration && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Thông tin đăng ký
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Trạng thái:</span>
                  {getStatusBadge(member.registration.status)}
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ngày đăng ký:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(member.registration.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {member.registration.invoice_code && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Mã hóa đơn:</span>
                      <span className="text-sm font-mono bg-background px-2 py-1 rounded">
                        {member.registration.invoice_code}
                      </span>
                    </div>
                  </>
                )}

                {member.registration.user && (
                  <>
                    <Separator />
                    <div>
                      <span className="font-medium">Người đăng ký:</span>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <p>{member.registration.user.full_name}</p>
                        <p>{member.registration.user.email}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Member Since */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Thông tin khác
            </h3>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Tham gia nhóm:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(member.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          {onEdit && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
          <div className={onEdit ? "" : "w-full flex justify-end"}>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
