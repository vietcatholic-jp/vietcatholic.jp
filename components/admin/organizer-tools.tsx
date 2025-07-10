"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  Download,
  QrCode,
  PieChart,
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { Registration, UserRole } from "@/lib/types";
import { toast } from "sonner";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

interface OrganizerToolsProps {
  registrations: Registration[];
  userRole: UserRole;
}

export function OrganizerTools({ registrations, userRole }: OrganizerToolsProps) {
  const [checkinStats, setCheckinStats] = useState({
    total: 0,
    checkedIn: 0,
    pending: 0,
    noShow: 0
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    // Calculate check-in statistics
    const stats = registrations.reduce((acc, reg) => {
      acc.total += reg.participant_count;
      
      if (reg.status === 'checked_in') {
        acc.checkedIn += reg.participant_count;
      } else if (reg.status === 'confirmed') {
        acc.pending += reg.participant_count;
      }
      
      return acc;
    }, { total: 0, checkedIn: 0, pending: 0, noShow: 0 });

    stats.noShow = stats.total - stats.checkedIn - stats.pending;
    setCheckinStats(stats);

    // Initialize emergency contacts (placeholder data)
    setEmergencyContacts([
      {
        id: '1',
        name: 'Ban tổ chức',
        phone: '+81-80-1234-5678',
        email: 'support@daihoiconggiao.jp',
        role: 'Tổ chức chính'
      }
    ]);
  }, [registrations]);

  const generateAttendeeList = async () => {
    try {
      const response = await fetch('/api/admin/attendee-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: 'csv' }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate attendee list');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `attendee-list-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Danh sách tham dự đã được tải xuống');
    } catch (error) {
      console.error('Error generating attendee list:', error);
      toast.error('Không thể tạo danh sách tham dự');
    }
  };

  const generateQRCodes = async () => {
    try {
      const response = await fetch('/api/admin/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'checkin' }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR codes');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `qr-codes-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Mã QR đã được tạo và tải xuống');
    } catch (error) {
      console.error('Error generating QR codes:', error);
      toast.error('Không thể tạo mã QR');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats for Event Day */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Tổng số
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{checkinStats.total}</div>
            <p className="text-xs text-blue-600">người tham gia</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-green-600" />
              Đã check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{checkinStats.checkedIn}</div>
            <p className="text-xs text-green-600">
              {checkinStats.total > 0 ? Math.round((checkinStats.checkedIn / checkinStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              Chờ check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{checkinStats.pending}</div>
            <p className="text-xs text-yellow-600">
              {checkinStats.total > 0 ? Math.round((checkinStats.pending / checkinStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Vắng mặt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{checkinStats.noShow}</div>
            <p className="text-xs text-red-600">
              {checkinStats.total > 0 ? Math.round((checkinStats.noShow / checkinStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organizer Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Attendee Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quản lý tham dự
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={generateAttendeeList}
            >
              <Download className="h-4 w-4 mr-2" />
              Tải danh sách tham dự
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={generateQRCodes}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Tạo mã QR check-in
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Báo cáo thống kê
            </Button>
          </CardContent>
        </Card>

        {/* Event Day Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Công cụ sự kiện
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Sơ đồ chỗ ngồi
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <Clock className="h-4 w-4 mr-2" />
              Lịch trình sự kiện
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Theo dõi thời gian thực
            </Button>
          </CardContent>
        </Card>

        {/* Communication Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Liên lạc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <Mail className="h-4 w-4 mr-2" />
              Gửi thông báo
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <Phone className="h-4 w-4 mr-2" />
              Liên hệ khẩn cấp
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Báo cáo sự cố
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Information */}
      {(userRole === 'group_leader' || userRole === 'event_organizer') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Thông tin hữu ích cho {userRole === 'group_leader' ? 'Trưởng nhóm' : 'Tổ chức viên'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Trước sự kiện:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Kiểm tra danh sách tham dự</li>
                  <li>• Xác nhận thanh toán của thành viên</li>
                  <li>• Chuẩn bị tài liệu cần thiết</li>
                  <li>• Liên hệ với thành viên chưa check-in</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Trong sự kiện:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Hỗ trợ thành viên check-in</li>
                  <li>• Theo dõi lịch trình</li>
                  <li>• Báo cáo vấn đề phát sinh</li>
                  <li>• Hỗ trợ điều phối hoạt động</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Liên hệ khẩn cấp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <div className="font-medium text-sm">{contact.name}</div>
                  <div className="text-xs text-muted-foreground">{contact.role}</div>
                </div>
                <div className="text-right text-sm">
                  <div>{contact.phone}</div>
                  <div className="text-xs text-muted-foreground">{contact.email}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
