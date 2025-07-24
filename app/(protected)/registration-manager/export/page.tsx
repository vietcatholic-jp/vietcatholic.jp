"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Filter, 
  Printer,
  BarChart3,
  Users,
  MapPin,
  Church,
  Download
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {Registrant,Registration, RegistrationStatus, SHIRT_SIZES, JAPANESE_PROVINCES } from "@/lib/types";
import { format } from "date-fns";
import { exportRegistrantsWithRolesCSV, RegistrantWithRoleAndRegistration } from "@/lib/csv-export";

interface ExportFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  includePersonalInfo: boolean;
  includePaymentInfo: boolean;
  includeRegistrants: boolean;
  reportType: string;
  teamName: string;
}

interface ExportPageState {
  registrations: Registration[];
  filteredRegistrations: Registration[];
  registrants: RegistrantWithRoleAndRegistration[];
  filteredRegistrants: RegistrantWithRoleAndRegistration[];
  loading: boolean;
  filters: ExportFilters;
  availableTeams: string[];
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'report_paid', label: 'Đã báo thanh toán' },
  { value: 'confirm_paid', label: 'Đã xác nhận thanh toán' },
  { value: 'payment_rejected', label: 'Thanh toán bị từ chối' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'checked_in', label: 'Đã check-in' },
  { value: 'cancelled', label: 'Đã hủy' }
];

const REPORT_TYPES = [
  { value: 'detailed', label: 'Báo cáo chi tiết', icon: Users },
  { value: 'registrants', label: 'Danh sách người tham gia theo ban', icon: Users },
  { value: 'shirt-size', label: 'Thống kê size áo', icon: BarChart3 },
  { value: 'province', label: 'Thống kê tỉnh thành', icon: MapPin },
  { value: 'diocese', label: 'Thống kê giáo phận', icon: Church }
];

function getStatusLabel(status: RegistrationStatus): string {
  const statusMap: Record<RegistrationStatus, string> = {
    'pending': 'Chờ thanh toán',
    'report_paid': 'Đã báo thanh toán',
    'confirm_paid': 'Đã xác nhận thanh toán',
    'payment_rejected': 'Thanh toán bị từ chối',
    'donation': 'Đã chuyển thành quyên góp',
    'cancel_pending': 'Chờ xử lý hủy',
    'cancel_accepted': 'Đã chấp nhận hủy',
    'cancel_rejected': 'Đã từ chối hủy',
    'cancel_processed': 'Đã hoàn tiền',
    'cancelled': 'Đã hủy',
    'confirmed': 'Đã xác nhận',
    'checked_in': 'Đã check-in',
    'checked_out': 'Đã check-out'
  };
  return statusMap[status] || status;
}

function getStatusBadgeVariant(status: RegistrationStatus) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    'pending': 'outline',
    'report_paid': 'secondary',
    'confirm_paid': 'default',
    'confirmed': 'default',
    'checked_in': 'default',
    'payment_rejected': 'destructive',
    'cancelled': 'destructive'
  };
  return variants[status] || 'outline';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

function formatParticipantNames(registrants: Registrant[]): string {
  if (!registrants || registrants.length === 0) return '';
  if (registrants.length === 1) return registrants[0].full_name;
  
  const primary = registrants.find(r => r.is_primary)?.full_name || registrants[0].full_name;
  const others = registrants.filter(r => !r.is_primary).length;
  
  if (others > 0) {
    return `${primary} (+ ${others} người khác)`;
  }
  return primary;
}

// Analytics helper functions
function generateShirtSizeStats(registrations: Registration[]) {
  const stats: { [size: string]: number } = {};
  
  registrations.forEach(reg => {
    reg.registrants?.forEach(registrant => {
      if (registrant.shirt_size) {
        stats[registrant.shirt_size] = (stats[registrant.shirt_size] || 0) + 1;
      }
    });
  });
  
  return Object.entries(stats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([size, count]) => ({ size, count }));
}

function generateProvinceStats(registrations: Registration[]) {
  const stats: { [province: string]: number } = {};
  
  registrations.forEach(reg => {
    reg.registrants?.forEach(registrant => {
      if (registrant.province) {
        stats[registrant.province] = (stats[registrant.province] || 0) + 1;
      }
    });
  });
  
  return Object.entries(stats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([province, count]) => ({ province, count }));
}

function generateDioceseStats(registrations: Registration[]) {
  const stats: { [diocese: string]: { total: number; goWith: number; individual: number } } = {};
  
  registrations.forEach(reg => {
    reg.registrants?.forEach(registrant => {
      if (registrant.diocese) {
        if (!stats[registrant.diocese]) {
          stats[registrant.diocese] = { total: 0, goWith: 0, individual: 0 };
        }
        stats[registrant.diocese].total += 1;
        
        if (registrant.go_with) {
          stats[registrant.diocese].goWith += 1;
        } else {
          stats[registrant.diocese].individual += 1;
        }
      }
    });
  });
  
  return Object.entries(stats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([diocese, counts]) => ({ diocese, ...counts }));
}

export default function ExportPage() {
  const [state, setState] = useState<ExportPageState>({
    registrations: [],
    filteredRegistrations: [],
    registrants: [],
    filteredRegistrants: [],
    loading: true,
    availableTeams: [],
    filters: {
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: '',
      includePersonalInfo: true,
      includePaymentInfo: true,
      includeRegistrants: true,
      reportType: 'detailed',
      teamName: 'all'
    }
  });

  // Check URL parameters for preset filters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filterType = urlParams.get('filter');
      
      if (filterType === 'payment-focused') {
        setState(prev => ({
          ...prev,
          filters: {
            ...prev.filters,
            includePersonalInfo: true,
            includePaymentInfo: true,
            includeRegistrants: false
          }
        }));
      }
    }
  }, []);

  // Fetch registration and registrants data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both registrations and registrants data
        const [registrationsResponse, registrantsResponse] = await Promise.all([
          fetch('/api/admin/export?type=registrations'),
          fetch('/api/admin/export?type=registrants')
        ]);
        
        if (!registrationsResponse.ok || !registrantsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const [registrationsData, registrantsData] = await Promise.all([
          registrationsResponse.json(),
          registrantsResponse.json()
        ]);

        // Extract unique team names for filtering
        const teams = new Set<string>();
        registrantsData.registrants?.forEach((r: RegistrantWithRoleAndRegistration) => {
          if (r.event_role?.team_name) {
            teams.add(r.event_role.team_name);
          }
        });
        
        setState(prev => ({
          ...prev,
          registrations: registrationsData.registrations || [],
          filteredRegistrations: registrationsData.registrations || [],
          registrants: registrantsData.registrants || [],
          filteredRegistrants: registrantsData.registrants || [],
          availableTeams: Array.from(teams).sort(),
          loading: false
        }));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Có lỗi xảy ra khi tải dữ liệu');
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  // Apply filters
  useEffect(() => {
    // Filter registrations
    let filteredRegs = [...state.registrations];

    // Status filter
    if (state.filters.status !== 'all') {
      filteredRegs = filteredRegs.filter(reg => reg.status === state.filters.status);
    }

    // Date range filter
    if (state.filters.dateFrom) {
      const fromDate = new Date(state.filters.dateFrom);
      filteredRegs = filteredRegs.filter(reg => new Date(reg.created_at) >= fromDate);
    }
    if (state.filters.dateTo) {
      const toDate = new Date(state.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredRegs = filteredRegs.filter(reg => new Date(reg.created_at) <= toDate);
    }

    // Search filter
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filteredRegs = filteredRegs.filter(reg => 
        reg.invoice_code.toLowerCase().includes(searchTerm) ||
        reg.user?.full_name?.toLowerCase().includes(searchTerm) ||
        reg.user?.email?.toLowerCase().includes(searchTerm) ||
        reg.registrants?.some(r => r.full_name.toLowerCase().includes(searchTerm))
      );
    }

    // Filter registrants
    let filteredRegsts = [...state.registrants];

    // Status filter for registrants (based on registration status)
    if (state.filters.status !== 'all') {
      filteredRegsts = filteredRegsts.filter(reg => reg.registration?.status === state.filters.status);
    }

    // Date range filter for registrants
    if (state.filters.dateFrom) {
      const fromDate = new Date(state.filters.dateFrom);
      filteredRegsts = filteredRegsts.filter(reg => 
        reg.registration?.created_at && new Date(reg.registration.created_at) >= fromDate
      );
    }
    if (state.filters.dateTo) {
      const toDate = new Date(state.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredRegsts = filteredRegsts.filter(reg => 
        reg.registration?.created_at && new Date(reg.registration.created_at) <= toDate
      );
    }

    // Search filter for registrants
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filteredRegsts = filteredRegsts.filter(reg => 
        reg.registration?.invoice_code?.toLowerCase().includes(searchTerm) ||
        reg.registration?.user?.full_name?.toLowerCase().includes(searchTerm) ||
        reg.registration?.user?.email?.toLowerCase().includes(searchTerm) ||
        reg.full_name.toLowerCase().includes(searchTerm) ||
        reg.email?.toLowerCase().includes(searchTerm)
      );
    }

    // Team filter for registrants
    if (state.filters.teamName && state.filters.teamName !== 'all') {
      filteredRegsts = filteredRegsts.filter(reg => 
        reg.event_role?.team_name === state.filters.teamName
      );
    }

    setState(prev => ({ 
      ...prev, 
      filteredRegistrations: filteredRegs,
      filteredRegistrants: filteredRegsts
    }));
  }, [state.filters, state.registrations, state.registrants]);

  const updateFilter = <K extends keyof ExportFilters>(key: K, value: ExportFilters[K]) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
  };

  const handlePrint = () => {
    window.print();
  };


  const handleExportCSV = () => {
    if (state.filters.reportType === 'registrants') {
      exportRegistrantsWithRolesCSV(state.filteredRegistrants);
      toast.success('Đã xuất dữ liệu registrants thành công!');
    } else {
      toast.info('Chức năng xuất CSV chỉ có sẵn cho báo cáo registrants');
    }
  };

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        status: 'all',
        dateFrom: '',
        dateTo: '',
        search: '',
        includePersonalInfo: true,
        includePaymentInfo: true,
        includeRegistrants: true,
        reportType: 'detailed',
        teamName: 'all'
      }
    }));
  };

  const totalAmount = state.filteredRegistrations.reduce((sum, reg) => sum + reg.total_amount, 0);
  const totalParticipants = state.filteredRegistrations.reduce((sum, reg) => sum + reg.participant_count, 0);

  if (state.loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Xuất dữ liệu đăng ký</h1>
          <p className="text-muted-foreground">Lọc và xuất dữ liệu theo yêu cầu</p>
          <Link href="/registration-manager" className="text-blue-500 hover:border-b hover:border-blue-500 hover:bg-blue-50 px-2 py-1 rounded">
            Quay lại quản lý đăng ký
          </Link>
        </div>
        <div className="flex gap-2">
          {state.filters.reportType === 'registrants' && (
            <Button onClick={handleExportCSV} className="no-print" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Xuất CSV
            </Button>
          )}
          <Button onClick={handlePrint} className="no-print">
            <Printer className="h-4 w-4 mr-2" />
            In / Xuất PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc dữ liệu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Type Selector */}
          <div>
            <Label htmlFor="reportType">Loại báo cáo</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {REPORT_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={state.filters.reportType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilter('reportType', type.value)}
                    className="justify-start"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={state.filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Từ ngày</Label>
              <Input
                id="dateFrom"
                type="date"
                value={state.filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Đến ngày</Label>
              <Input
                id="dateTo"
                type="date"
                value={state.filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <Input
                id="search"
                placeholder="Mã đăng ký, tên, email..."
                value={state.filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
          </div>

          {/* Team filter for registrants report */}
          {state.filters.reportType === 'registrants' && (
            <div>
              <Label htmlFor="teamName">Lọc theo nhóm</Label>
              <Select value={state.filters.teamName} onValueChange={(value) => updateFilter('teamName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả nhóm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhóm</SelectItem>
                  {state.availableTeams.map(team => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {state.filters.reportType === 'detailed' && (
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePersonalInfo"
                  checked={state.filters.includePersonalInfo}
                  onCheckedChange={(checked) => updateFilter('includePersonalInfo', checked as boolean)}
                />
                <Label htmlFor="includePersonalInfo">Thông tin cá nhân</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includePaymentInfo"
                  checked={state.filters.includePaymentInfo}
                  onCheckedChange={(checked) => updateFilter('includePaymentInfo', checked as boolean)}
                />
                <Label htmlFor="includePaymentInfo">Thông tin thanh toán</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRegistrants"
                  checked={state.filters.includeRegistrants}
                  onCheckedChange={(checked) => updateFilter('includeRegistrants', checked as boolean)}
                />
                <Label htmlFor="includeRegistrants">Chi tiết người tham gia</Label>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className={`print-include print-header`}>
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold">
            BÁO CÁO ĐĂNG KÝ THAM GIA ĐẠI HỘI NĂM THÁNH 2025 TẠI NHẬT BẢN
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Ngày xuất: {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </CardHeader>
        <CardContent>
          {state.filters.reportType === 'registrants' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{state.filteredRegistrants.length}</div>
              <div className="text-sm text-muted-foreground">Tổng người tham gia</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {state.filteredRegistrants.filter(r => ['confirm_paid', 'confirmed', 'checked_in'].includes(r.registration?.status ?? "")).length}
              </div>
              <div className="text-sm text-muted-foreground">Đã xác nhận</div>
            </div>
          </div>
          ):(
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{state.filteredRegistrations.length}</div>
              <div className="text-sm text-muted-foreground">Tổng đăng ký</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalParticipants}</div>
              <div className="text-sm text-muted-foreground">Tổng người tham gia</div>
            </div>
            {state.filters.reportType === 'detailed' && (
            <div>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-muted-foreground">Tổng số tiền</div>
            </div>)}
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {state.filteredRegistrations.filter(r => ['confirm_paid', 'confirmed', 'checked_in'].includes(r.status)).length}
              </div>
              <div className="text-sm text-muted-foreground">Đã xác nhận</div>
            </div>
          </div>
          )}
          
        </CardContent>
      </Card>

      {/* Conditional Report Content */}
      {state.filters.reportType === 'detailed' && (
        <Card className="print-include">
          <CardHeader>
            <CardTitle>Chi tiết đăng ký ({state.filteredRegistrations.length} kết quả)</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Mã đăng ký</th>
                  {state.filters.includePersonalInfo && (
                    <>
                      <th className="border border-gray-300 p-2 text-left">Người đăng ký</th>
                      <th className="border border-gray-300 p-2 text-left">Email</th>
                    </>
                  )}
                  <th className="border border-gray-300 p-2 text-left">Số người</th>
                  <th className="border border-gray-300 p-2 text-left">Trạng thái</th>
                  {state.filters.includePaymentInfo && (
                    <th className="border border-gray-300 p-2 text-left">Số tiền</th>
                  )}
                  <th className="border border-gray-300 p-2 text-left">Ngày đăng ký</th>
                  {state.filters.includeRegistrants && (
                    <th className="border border-gray-300 p-2 text-left">Người tham gia</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {state.filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-mono text-sm">
                      {registration.invoice_code}
                    </td>
                    {state.filters.includePersonalInfo && (
                      <>
                        <td className="border border-gray-300 p-2">
                          {registration.user?.full_name || 'N/A'}
                        </td>
                        <td className="border border-gray-300 p-2 text-sm">
                          {registration.user?.email || 'N/A'}
                        </td>
                      </>
                    )}
                    <td className="border border-gray-300 p-2 text-center">
                      {registration.participant_count}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Badge variant={getStatusBadgeVariant(registration.status)}>
                        {getStatusLabel(registration.status)}
                      </Badge>
                    </td>
                    {state.filters.includePaymentInfo && (
                      <td className="border border-gray-300 p-2 text-right">
                        {formatCurrency(registration.total_amount)}
                      </td>
                    )}
                    <td className="border border-gray-300 p-2 text-sm">
                      {format(new Date(registration.created_at), 'dd/MM/yyyy')}
                    </td>
                    {state.filters.includeRegistrants && (
                      <td className="border border-gray-300 p-2">
                        {formatParticipantNames(registration.registrants || [])}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {state.filteredRegistrations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Không có dữ liệu phù hợp với bộ lọc
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shirt Size Report */}
      {state.filters.reportType === 'shirt-size' && (
        <Card className="print-include">
          <CardHeader>
            <CardTitle>Thống kê size áo ({state.filteredRegistrations.length} đăng ký)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Size áo</th>
                    <th className="border border-gray-300 p-2 text-left">Số lượng</th>
                    <th className="border border-gray-300 p-2 text-left">Tỷ lệ %</th>
                  </tr>
                </thead>
                <tbody>
                  {generateShirtSizeStats(state.filteredRegistrations).map(({ size, count }) => {
                    const total = state.filteredRegistrations.reduce((sum, reg) => sum + (reg.registrants?.length || 0), 0);
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                    const sizeLabel = SHIRT_SIZES.find(s => s.value === size)?.label || size;
                    return (
                      <tr key={size} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium">{sizeLabel}</td>
                        <td className="border border-gray-300 p-2 text-center">{count}</td>
                        <td className="border border-gray-300 p-2 text-center">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Province Report */}
      {state.filters.reportType === 'province' && (
        <Card className="print-include">
          <CardHeader>
            <CardTitle>Thống kê tỉnh thành ({state.filteredRegistrations.length} đăng ký)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Tỉnh thành</th>
                    <th className="border border-gray-300 p-2 text-left">Số lượng</th>
                    <th className="border border-gray-300 p-2 text-left">Tỷ lệ %</th>
                  </tr>
                </thead>
                <tbody>
                  {generateProvinceStats(state.filteredRegistrations).map(({ province, count }) => {
                    const total = state.filteredRegistrations.reduce((sum, reg) => sum + (reg.registrants?.length || 0), 0);
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                    const provinceLabel = JAPANESE_PROVINCES.find(p => p.value === province)?.label || province;
                    return (
                      <tr key={province} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium">{provinceLabel}</td>
                        <td className="border border-gray-300 p-2 text-center">{count}</td>
                        <td className="border border-gray-300 p-2 text-center">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diocese Report */}
      {state.filters.reportType === 'diocese' && (
        <Card className="print-include">
          <CardHeader>
            <CardTitle>Thống kê giáo phận ({state.filteredRegistrations.length} đăng ký)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Giáo phận</th>
                    <th className="border border-gray-300 p-2 text-left">Tổng số</th>
                    <th className="border border-gray-300 p-2 text-left">Đăng ký riêng</th>
                    <th className="border border-gray-300 p-2 text-left">Đi cùng</th>
                    <th className="border border-gray-300 p-2 text-left">Tỷ lệ %</th>
                  </tr>
                </thead>
                <tbody>
                  {generateDioceseStats(state.filteredRegistrations).map(({ diocese, total, individual, goWith }) => {
                    const grandTotal = state.filteredRegistrations.reduce((sum, reg) => sum + (reg.registrants?.length || 0), 0);
                    const percentage = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : '0';
                    return (
                      <tr key={diocese} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium">{diocese}</td>
                        <td className="border border-gray-300 p-2 text-center font-semibold">{total}</td>
                        <td className="border border-gray-300 p-2 text-center">{individual}</td>
                        <td className="border border-gray-300 p-2 text-center text-blue-600">{goWith}</td>
                        <td className="border border-gray-300 p-2 text-center">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Giải thích:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Đăng ký riêng:</strong> Người tự đăng ký di chuyển tự do</li>
                <li><strong className="text-blue-600">Đi cùng:</strong> Người được đăng ký có nhu cầu đi xe bus chung</li>
                <li><strong>Tổng số:</strong> Tổng cộng tất cả người tham gia từ giáo phận này</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Registrants Report */}
      {state.filters.reportType === 'registrants' && (
        <Card className="print-include">
          <CardHeader>
            <CardTitle>
              Danh sách người tham gia ({state.filteredRegistrants.length} người)
              {state.filters.teamName && ` - Nhóm: ${state.filters.teamName}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Họ tên</th>
                    <th className="border border-gray-300 p-2 text-left">Fb/Email</th>
                    <th className="border border-gray-300 p-2 text-left">Giới tính</th>
                    <th className="border border-gray-300 p-2 text-left">Giáo phận</th>
                    <th className="border border-gray-300 p-2 text-left">Size áo</th>
                    <th className="border border-gray-300 p-2 text-left">Vai trò</th>
                    <th className="border border-gray-300 p-2 text-left">Trạng thái đăng ký</th>
                  </tr>
                </thead>
                <tbody>
                  {state.filteredRegistrants.map((registrant) => (
                    <tr key={registrant.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2">
                        {registrant.full_name}
                        {registrant.is_primary && <span className="ml-1 text-blue-600 text-xs">(Chính)</span>}
                      </td>
                      <td className="border border-gray-300 p-2 text-sm">
                        {registrant.facebook_link || registrant.email || 'N/A'}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {registrant.gender === 'male' ? 'Nam' : registrant.gender === 'female' ? 'Nữ' : 'Khác'}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {registrant.diocese || 'N/A'}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {SHIRT_SIZES.find(s => s.value === registrant.shirt_size)?.label || registrant.shirt_size}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {registrant.event_role?.name || (registrant.event_role_id ? 'Unknown Role' : 'Tham dự viên')}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Badge variant={getStatusBadgeVariant(registrant.registration?.status as RegistrationStatus)}>
                          {getStatusLabel(registrant.registration?.status as RegistrationStatus)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {state.filteredRegistrants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Không có dữ liệu phù hợp với bộ lọc
              </div>
            )}

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Thống kê:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Tổng số người:</span> {state.filteredRegistrants.length}
                </div>
                <div>
                  <span className="font-medium">Người có vai trò:</span> {state.filteredRegistrants.filter(r => r.event_role?.name).length}
                </div>
                <div>
                  <span className="font-medium">Participants:</span> {state.filteredRegistrants.filter(r => !r.event_role?.name && !r.event_role_id).length}
                </div>
                <div>
                  <span className="font-medium">Người chính:</span> {state.filteredRegistrants.filter(r => r.is_primary).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything by default */
          * {
            visibility: hidden;
          }
          
          /* Show only print-include sections and their children */
          .print-include,
          .print-include * {
            visibility: visible;
          }
          
          /* Hide elements with no-print class */
          .no-print {
            display: none !important;
          }
          
          /* Position the print-include sections at the top */
          .print-include {
            position: static;
          }
          
          body {
            font-size: 12px;
            line-height: 1.4;
          }
          
          table {
            font-size: 10px;
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          .container {
            max-width: none;
            padding: 0;
          }
          
          .print-include {
            border: none;
            box-shadow: none;
            margin-bottom: 20px;
          }
          
          /* Ensure proper page breaks */
          .print-header {
            page-break-before: avoid;
            page-break-after: avoid;
          }
          
          /* Remove card styling for print */
          .print-include .card,
          .print-include [class*="card"] {
            border: none;
            box-shadow: none;
            background: white;
          }
          
          /* Make sure table headers repeat on each page */
          thead {
            display: table-header-group;
          }
          
          /* Better table formatting */
          table {
            border-collapse: collapse;
            width: 100%;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 4px 6px;
            text-align: left;
          }
          
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
        }
      `}</style>
    </div>
  );
}