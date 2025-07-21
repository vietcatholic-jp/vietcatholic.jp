"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Database, 
  FileText, 
  Users, 
  Shield,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { exportRegistrationsCSV, exportRegistrantsCSV, exportFullBackup } from "@/lib/csv-export";
import { Registration } from "@/lib/types";

interface BackupData {
  registrations: Registration[];
  users: Record<string, unknown>[];
  event_configs: Record<string, unknown>[];
  event_teams: Record<string, unknown>[];
  event_roles: Record<string, unknown>[];
  groups: Record<string, unknown>[];
  cancel_requests: Record<string, unknown>[];
  tickets: Record<string, unknown>[];
  ticket_frames: Record<string, unknown>[];
  backup_timestamp: string;
  total_registrations: number;
  total_registrants: number;
}

export function BackupExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<BackupData | null>(null);

  const fetchBackupData = async (): Promise<BackupData> => {
    const response = await fetch('/api/admin/backup-export');
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Chỉ super admin mới có quyền truy cập backup');
      }
      throw new Error('Failed to fetch backup data');
    }
    return response.json();
  };

  const handleExport = async (type: 'registrations' | 'registrants' | 'full') => {
    try {
      setIsExporting(true);
      toast.info('Đang tải dữ liệu backup...');

      const data = await fetchBackupData();
      setLastBackup(data);

      switch (type) {
        case 'registrations':
          exportRegistrationsCSV(data.registrations);
          toast.success('Đã xuất file CSV registrations thành công!');
          break;
        case 'registrants':
          exportRegistrantsCSV(data.registrations);
          toast.success('Đã xuất file CSV registrants thành công!');
          break;
        case 'full':
          await exportFullBackup(data.registrations);
          toast.success('Đã xuất toàn bộ backup thành công!');
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xuất backup');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Backup & Export
          </h1>
          <p className="text-muted-foreground">Xuất dữ liệu backup cho super admin</p>
        </div>
      </div>

      {/* Security Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Chỉ dành cho Super Admin:</strong> Chức năng này xuất toàn bộ dữ liệu hệ thống bao gồm thông tin cá nhân. 
          Vui lòng đảm bảo tuân thủ các quy định bảo mật và quyền riêng tư khi sử dụng dữ liệu này.
        </AlertDescription>
      </Alert>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Registrations Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Registrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Xuất bảng registrations với thông tin đăng ký và user liên quan
            </p>
            <Button 
              onClick={() => handleExport('registrations')}
              disabled={isExporting}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Đang xuất...' : 'Xuất Registrations CSV'}
            </Button>
          </CardContent>
        </Card>

        {/* Registrants Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registrants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Xuất bảng registrants với chi tiết từng người tham gia
            </p>
            <Button 
              onClick={() => handleExport('registrants')}
              disabled={isExporting}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Đang xuất...' : 'Xuất Registrants CSV'}
            </Button>
          </CardContent>
        </Card>

        {/* Full Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Full Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Xuất cả hai file CSV và toàn bộ dữ liệu liên quan
            </p>
            <Button 
              onClick={() => handleExport('full')}
              disabled={isExporting}
              className="w-full"
              variant="default"
            >
              <Database className="h-4 w-4 mr-2" />
              {isExporting ? 'Đang xuất...' : 'Xuất Full Backup'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup Information */}
      {lastBackup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Thông tin backup gần nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{lastBackup.total_registrations}</div>
                <div className="text-sm text-muted-foreground">Tổng đăng ký</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{lastBackup.total_registrants}</div>
                <div className="text-sm text-muted-foreground">Tổng người tham gia</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{lastBackup.users?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Tổng người dùng</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">{lastBackup.tickets?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Vé đã tạo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{lastBackup.cancel_requests?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Yêu cầu hủy</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Thời gian backup: {new Date(lastBackup.backup_timestamp).toLocaleString('vi-VN')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV Format Information */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin về định dạng CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Registrations CSV bao gồm:</h4>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Thông tin đăng ký: ID, invoice_code, status, total_amount, participant_count</li>
              <li>Thông tin người dùng: email, full_name, region, role</li>
              <li>Metadata: created_at, updated_at, notes</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium">Registrants CSV bao gồm:</h4>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Thông tin cá nhân: full_name, email, saint_name, gender, age_group</li>
              <li>Địa chỉ: province, diocese, address, phone</li>
              <li>Sự kiện: shirt_size, event_role, is_primary, go_with</li>
              <li>Liên kết: registration_id, registration_invoice_code</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}