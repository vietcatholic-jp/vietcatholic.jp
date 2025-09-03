"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { MemberCardProps } from "@/lib/types/team-management";
import { AvatarManager } from "../avatar";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="default" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Đã xác nhận
        </Badge>
      );
    
    case 'temp_confirmed':
    return (
      <Badge variant="default" className="text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Xác nhận tạm thời
      </Badge>
    );
    case 'pending':
      return (
        <Badge variant="secondary" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Chờ xử lý
        </Badge>
      );
    case 'report_paid':
      return (
        <Badge variant="outline" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Báo đã thanh toán
        </Badge>
      );
    case 'confirm_paid':
      return (
        <Badge variant="default" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Xác nhận thanh toán
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
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


export function MemberCard({ member, onViewDetails }: MemberCardProps) {
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(member);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
              <AvatarManager
                registrantId={member.id}
                registrantName={member.full_name}
                currentAvatarUrl={member.portrait_url}
                size="md"
                editable={true}
                className="w-10 h-10 border-2 border-white shadow-md hover:shadow-lg transition-all duration-200"
              />
          </div>
          {/* Member Info */}
          <div className="flex-1 min-w-0 ml-12">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
              <div>
                <h4 className="font-semibold text-lg truncate">{member.full_name}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
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
              
              <div className="flex flex-col items-end gap-1">
                {member.registration && getStatusBadge(member.registration.status)}
                {member.event_role && (
                  <Badge variant="secondary" className="text-xs">
                    {member.event_role.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact Info - Compact */}
            <div className="space-y-1 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{member.province} - {member.diocese}</span>
              </div>
              
              {member.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              
              {member.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 flex-shrink-0" />
                  <span>{member.phone}</span>
                </div>
              )}
            </div>

            {/* Facebook Link */}
            {member.facebook_link && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Facebook className="h-3 w-3 flex-shrink-0 text-blue-600" />
                  <a
                    href={member.facebook_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors truncate"
                  >
                    {member.facebook_link}
                  </a>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Chi tiết
              </Button>
            </div>

            {/* Registration Info */}
            {member.registration && (
              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                <span>Đăng ký: {new Date(member.registration.created_at).toLocaleDateString('vi-VN')}</span>
                {member.registration.invoice_code && (
                  <span className="ml-2">• Mã: {member.registration.invoice_code}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
