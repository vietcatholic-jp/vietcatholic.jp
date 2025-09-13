"use client";

import { useState } from "react";
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
  AlertCircle,
  CreditCard,
  Ticket,
  Loader2
} from "lucide-react";
import { MemberCardProps } from "@/lib/types/team-management";
import { AvatarManager } from "../avatar";
import { generateTicketImage as generateTicketImageUtil, generateBadgeImage } from "@/lib/ticket-utils";
import { Registrant, ShirtSizeType } from "@/lib/types";
import { toast } from "sonner";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="info" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Đã xác nhận
        </Badge>
      );
    
    case 'temp_confirmed':
    return (
      <Badge variant="warning" className="text-xs">
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
    case 'checked_in':
      return (
        <Badge variant="success" className="text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Đã check-in
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


export function MemberCard({ member,teamName,  onViewDetails }: MemberCardProps) {
  const [isDownloadingTicket, setIsDownloadingTicket] = useState(false);
  const [isDownloadingBadge, setIsDownloadingBadge] = useState(false);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(member);
    }
  };

  // Convert TeamMember to Registrant format for download
  const convertToRegistrant = (member: MemberCardProps['member']): Registrant => {
    return {
      id: member.id,
      registration_id: member.registration?.id || '',
      email: member.email,
      saint_name: member.saint_name || '',
      full_name: member.full_name,
      gender: member.gender,
      age_group: member.age_group === 'under_18' ? 'under_12' : 
                 member.age_group === '18_25' ? '18_25' : 
                 member.age_group === '26_35' ? '26_35' : 
                 member.age_group === '36_50' ? '36_50' : 'over_50',
      province: member.province,
      diocese: member.diocese,
      address: undefined,
      facebook_link: member.facebook_link,
      phone: member.phone,
      shirt_size: 'M' as ShirtSizeType,
      event_team_id: undefined,
      event_team: {
        name: teamName || member.event_team?.name || ''
      },
      event_role_id: member.event_role?.id,
      event_role: member.event_role,
      portrait_url: member.portrait_url,
      go_with: undefined,
      second_day_only: false,
      selected_attendance_day: undefined,
      notes: undefined,
      created_at: member.created_at,
      updated_at: member.updated_at,
      is_checked_in: false,
      checked_in_at: undefined
    };
  };

  const handleDownloadTicket = async () => {
    if (!member.registration || !['confirmed','temp_confirmed'].includes(member.registration.status)) {
      toast.error('Chỉ có thể tải vé cho thành viên đã xác nhận');
      return;
    }

    setIsDownloadingTicket(true);
    try {
      const registrant = convertToRegistrant(member);
      const blob = await generateTicketImageUtil(registrant);
      
      if (blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${member.registration.invoice_code || 'ticket'}-${member.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast.success('Đã tải vé thành công!');
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Có lỗi xảy ra khi tải vé');
    } finally {
      setIsDownloadingTicket(false);
    }
  };

  const handleDownloadBadge = async () => {
    if (!member.registration || !['confirmed','temp_confirmed'].includes(member.registration.status)) {
      toast.error('Chỉ có thể tải thẻ cho thành viên đã xác nhận');
      return;
    }

    setIsDownloadingBadge(true);
    try {
      const registrant = convertToRegistrant(member);
      const imageUrl = await generateBadgeImage(registrant);
      
      if (imageUrl) {
        const imageData = imageUrl.split(',')[1];
        const blob = new Blob([Uint8Array.from(atob(imageData), c => c.charCodeAt(0))], { type: 'image/png' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Badge-${member.full_name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast.success('Đã tải thẻ thành công!');
      }
    } catch (error) {
      console.error('Error downloading badge:', error);
      toast.error('Có lỗi xảy ra khi tải thẻ');
    } finally {
      setIsDownloadingBadge(false);
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
                <p className="text-sm text-muted-foreground mb-1">{member.saint_name || '-'}</p>
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
                {member.is_checked_in && (
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Đã check-in
                  </Badge>
                )}
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
            <div className="flex items-center justify-end gap-2 flex-wrap">
              {/* Download buttons - only show for confirmed members */}
              {member.registration && ['confirmed','temp_confirmed'].includes(member.registration.status) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTicket}
                    disabled={isDownloadingTicket}
                    className="text-xs"
                  >
                    {isDownloadingTicket ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Ticket className="h-3 w-3 mr-1" />
                    )}
                    Vé
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadBadge}
                    disabled={isDownloadingBadge}
                    className="text-xs"
                  >
                    {isDownloadingBadge ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <CreditCard className="h-3 w-3 mr-1" />
                    )}
                    Thẻ
                  </Button>
                </>
              )}
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
