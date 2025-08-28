"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Filter,
  BarChart3,
  Users,
  MapPin,
  Church,
  ArrowUpDown
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {Registration, RegistrationStatus, SHIRT_SIZES, JAPANESE_PROVINCES, AGE_GROUPS, EventConfig } from "@/lib/types";
import { format } from "date-fns";

import {  RegistrantWithRoleAndRegistration } from "@/lib/csv-export";


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
  ageGroup: string; // added age group filter
  gender: string; // new gender filter
  province: string; // new province filter
  diocese: string; // new diocese filter
  attendanceDay: string; // filter by attendance day (all, first, second)
  sortBy: string; // sorting field
  sortDirection: 'asc' | 'desc'; // sorting direction
}

interface ExportPageState {
  registrations: Registration[];
  filteredRegistrations: Registration[];
  registrants: RegistrantWithRoleAndRegistration[];
  filteredRegistrants: RegistrantWithRoleAndRegistration[];
  loading: boolean;
  filters: ExportFilters;
  availableTeams: string[];
  availableDioceses: string[]; // new
  eventConfig: EventConfig | null; // add event config
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ đóng phí tham dự' },
  { value: 'report_paid', label: 'Đã báo đóng phí tham dự' },
  { value: 'confirm_paid', label: 'Đã xác nhận đóng phí tham dự' },
  { value: 'payment_rejected', label: 'Đóng phí tham dự bị từ chối' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'temp_confirmed', label: 'Đã xác nhận (thanh toán sau)' },
  { value: 'all_confirmed', label: 'Tất cả đã xác nhận' },
  { value: 'checked_in', label: 'Đã check-in' },
  { value: 'checked_out', label: 'Đã check-out' },
  { value: 'donation', label: 'Đã chuyển thành quyên góp' },
  { value: 'cancel_pending', label: 'Chờ xử lý hủy' },
  { value: 'cancel_accepted', label: 'Đã chấp nhận hủy' },
  { value: 'cancel_rejected', label: 'Đã từ chối hủy' },
  { value: 'cancel_processed', label: 'Đã hoàn tiền' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'be_cancelled', label: 'Đã bị hủy' },
];

const REPORT_TYPES = [
  { value: 'registrants', label: 'Danh sách người tham', icon: Users },
  { value: 'shirt-size', label: 'Thống kê size áo', icon: BarChart3 },
  { value: 'province', label: 'Thống kê tỉnh thành', icon: MapPin },
  { value: 'diocese', label: 'Thống kê giáo phận', icon: Church }
];

const GENDER_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Họ tên' },
  { value: 'province', label: 'Tỉnh thành' },
  { value: 'diocese', label: 'Giáo phận' },
  { value: 'gender', label: 'Giới tính' },
  { value: 'status', label: 'Trạng thái' }
];

// Generate attendance day options dynamically based on event config
// This function supports events of any duration (1 day, 2 days, 3 days, etc.)
// It calculates the number of days between start_date and end_date and generates appropriate labels
function generateAttendanceDayOptions(eventConfig: EventConfig | null) {
  const options = [{ value: 'all', label: 'Tất cả' }
    ,{ value: 'both', label: 'Tham gia đầy đủ' }
  ];
  
  if (!eventConfig?.start_date || !eventConfig?.end_date) {
    return options;
  }

  const startDate = new Date(eventConfig.start_date);
  const endDate = new Date(eventConfig.end_date);
  
  // Calculate number of days
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  
  // Generate options for each day
  for (let i = 0; i < diffDays; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const formattedDate = currentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    
    const label = `Ngày (${formattedDate})`;
    
    options.push({
      value: dateString,
      label: label
    });
  }
  
  return options;
}

function getStatusLabel(status: RegistrationStatus): string {
  const statusMap: Record<RegistrationStatus, string> = {
    'pending': 'Chờ đóng phí tham dự',
    'report_paid': 'Đã báo đóng phí tham dự',
    'confirm_paid': 'Đã xác nhận đóng phí tham dự',
    'payment_rejected': 'Đóng phí tham dự bị từ chối',
    'donation': 'Đã chuyển thành quyên góp',
    'cancel_pending': 'Chờ xử lý hủy',
    'cancel_accepted': 'Đã chấp nhận hủy',
    'cancel_rejected': 'Đã từ chối hủy',
    'cancel_processed': 'Đã hoàn tiền',
    'be_cancelled': 'Đã hủy',
    'cancelled': 'Đã hủy',
    'confirmed': 'Đã xác nhận',
    'checked_in': 'Đã check-in',
    'checked_out': 'Đã check-out',
    'temp_confirmed': 'Đã xác nhận (thanh toán sau)'
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
    'cancelled': 'destructive',
    'cancel_pending': 'outline',
    'cancel_accepted': 'outline',
    'cancel_rejected': 'destructive',
    'cancel_processed': 'destructive',
    'donation': 'secondary',
    'checked_out': 'secondary',
    'temp_confirmed': 'secondary',
    'default': 'outline' // Fallback for any unknown status
  };
  return variants[status] || 'outline';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
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
  const stats: { [province: string]: { total: number; goWith: number; individual: number } } = {};
  
  registrations.forEach(reg => {
    reg.registrants?.forEach(registrant => {
      if (registrant.province) {
        stats[registrant.province] = stats[registrant.province] || { total: 0, goWith: 0, individual: 0 };
        stats[registrant.province].total += 1;
        if (registrant.go_with) {
          stats[registrant.province].goWith += 1;
        } else {
          stats[registrant.province].individual += 1;
        }
      }
    });
  });
  
  return Object.entries(stats)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([province, { total, goWith, individual }]) => ({
      province,
      total,
      goWith,
      individual
    }));
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
    availableDioceses: [],
    eventConfig: null,
    filters: {
      status: 'confirmed',
      dateFrom: '',
      dateTo: '',
      search: '',
      includePersonalInfo: true,
      includePaymentInfo: true,
      includeRegistrants: true,
      reportType: 'registrants',
      teamName: 'all',
      ageGroup: 'all',
      gender: 'all',
      province: 'all',
      diocese: 'all',
      attendanceDay: 'all',
      sortBy: 'name',
      sortDirection: 'asc'
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
        // Fetch registrations, registrants data, and event config
        const [registrationsResponse, registrantsResponse, eventConfigResponse] = await Promise.all([
          fetch('/api/admin/export?type=registrations'),
          fetch('/api/admin/export?type=registrants'),
          fetch('/api/admin/events')
        ]);
        
        if (!registrationsResponse.ok || !registrantsResponse.ok || !eventConfigResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const [registrationsData, registrantsData, eventConfigData] = await Promise.all([
          registrationsResponse.json(),
          registrantsResponse.json(),
          eventConfigResponse.json()
        ]);

        // Get active event config
        const activeEvent = eventConfigData.events?.find((event: EventConfig) => event.is_active) || eventConfigData.events?.[0] || null;

        // Extract unique team names & dioceses for filtering
        const teams = new Set<string>();
        const dioceses = new Set<string>();
        registrantsData.registrants?.forEach((r: RegistrantWithRoleAndRegistration) => {
          if (r.event_roles?.team_name) {
            teams.add(r.event_roles.team_name);
          }
          if (r.diocese) {
            dioceses.add(r.diocese.trim());
          }
        });
        
        setState(prev => ({
          ...prev,
          registrations: registrationsData.registrations || [],
          filteredRegistrations: registrationsData.registrations || [],
          registrants: registrantsData.registrants || [],
          filteredRegistrants: registrantsData.registrants || [],
          availableTeams: Array.from(teams).sort((a,b)=>a.localeCompare(b,'vi',{sensitivity:'base'})),
          availableDioceses: Array.from(dioceses).sort((a,b)=>a.localeCompare(b,'vi',{sensitivity:'base'})),
          eventConfig: activeEvent,
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
    let filteredRegsts = [...state.registrants];

    // Status filter
    if (state.filters.status !== 'all' && state.filters.status !== 'all_confirmed') {
      filteredRegs = filteredRegs.filter(reg => reg.status === state.filters.status);
      filteredRegsts = filteredRegsts.filter(reg => reg.registration?.status === state.filters.status);
    }

    if (state.filters.status === 'all_confirmed') {
      filteredRegs = filteredRegs.filter(reg => ['report_paid','confirm_paid','confirmed', 'temp_confirmed', 'checked_in'].includes(reg.status));
      filteredRegsts = filteredRegsts.filter(reg => ['report_paid','confirm_paid','confirmed', 'temp_confirmed', 'checked_in'].includes(reg.registration?.status || ""));
    }

    // Date range
    if (state.filters.dateFrom) {
      const fromDate = new Date(state.filters.dateFrom);
      filteredRegs = filteredRegs.filter(reg => new Date(reg.created_at) >= fromDate);
      filteredRegsts = filteredRegsts.filter(reg => reg.registration?.created_at && new Date(reg.registration.created_at) >= fromDate);
    }
    if (state.filters.dateTo) {
      const toDate = new Date(state.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredRegs = filteredRegs.filter(reg => new Date(reg.created_at) <= toDate);
      filteredRegsts = filteredRegsts.filter(reg => reg.registration?.created_at && new Date(reg.registration.created_at) <= toDate);
    }

    // Search
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filteredRegs = filteredRegs.filter(reg => 
        reg.invoice_code.toLowerCase().includes(searchTerm) ||
        reg.user?.full_name?.toLowerCase().includes(searchTerm) ||
        reg.user?.email?.toLowerCase().includes(searchTerm) ||
        reg.registrants?.some(r => r.full_name.toLowerCase().includes(searchTerm))
      );
      filteredRegsts = filteredRegsts.filter(reg => 
        reg.registration?.invoice_code?.toLowerCase().includes(searchTerm) ||
        reg.registration?.user?.full_name?.toLowerCase().includes(searchTerm) ||
        reg.registration?.user?.email?.toLowerCase().includes(searchTerm) ||
        reg.full_name.toLowerCase().includes(searchTerm) ||
        reg.email?.toLowerCase().includes(searchTerm)
      );
    }

    // Team
    if (state.filters.teamName !== 'all') {
      filteredRegsts = filteredRegsts.filter(reg => reg.event_roles?.team_name === state.filters.teamName);
    }

    // Age group
    if (state.filters.ageGroup !== 'all') {
      filteredRegs = filteredRegs.filter(reg => reg.registrants?.some(r => r.age_group === state.filters.ageGroup));
      filteredRegsts = filteredRegsts.filter(reg => reg.age_group === state.filters.ageGroup);
    }

    // Gender
    if (state.filters.gender !== 'all') {
      filteredRegs = filteredRegs.filter(reg => reg.registrants?.some(r => r.gender === state.filters.gender));
      filteredRegsts = filteredRegsts.filter(reg => reg.gender === state.filters.gender);
    }

    // Province
    if (state.filters.province !== 'all') {
      filteredRegs = filteredRegs.filter(reg => reg.registrants?.some(r => r.province === state.filters.province));
      filteredRegsts = filteredRegsts.filter(reg => reg.province === state.filters.province);
    }

    // Diocese
    if (state.filters.diocese !== 'all') {
      filteredRegs = filteredRegs.filter(reg => reg.registrants?.some(r => r.diocese === state.filters.diocese));
      filteredRegsts = filteredRegsts.filter(reg => reg.diocese === state.filters.diocese);
    }

    // Attendance Day
    if (state.filters.attendanceDay !== 'all' && state.eventConfig) {
      const selectedDate = state.filters.attendanceDay; // This is now a date string (YYYY-MM-DD)
      if (selectedDate === 'both') {
        // Show registrants attending both days:
        // - Those attending all days (!second_day_only)
        // - Those who specifically selected both days
        filteredRegs = filteredRegs.filter(reg => 
          reg.registrants?.some(r => 
             r.second_day_only === false
          )
        );
        filteredRegsts = filteredRegsts.filter(reg => 
          reg.second_day_only === false  
        );
      }else{
        // Show registrants attending the selected day:
        // - Those attending all days (!second_day_only)
        // - Those who specifically selected this day
        filteredRegs = filteredRegs.filter(reg => 
          reg.registrants?.some(r => 
            r.selected_attendance_day === selectedDate
          )
        );
        filteredRegsts = filteredRegsts.filter(reg => 
          reg.selected_attendance_day === selectedDate
        );
      }
      
    }

    // Sorting (registrants)
    const { sortBy, sortDirection } = state.filters;
    if (sortBy) {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const cmp = (a?: string, b?: string) => (a?.localeCompare(b || '', 'vi', { sensitivity: 'base' }) || 0) * dir;
      filteredRegsts.sort((a, b) => {
        switch (sortBy) {
          case 'name': return cmp(a.full_name, b.full_name);
          case 'province': return cmp(a.province, b.province);
          case 'diocese': return cmp(a.diocese, b.diocese);
          case 'gender': return cmp(a.gender, b.gender);
          case 'status': return cmp(a.registration?.status, b.registration?.status);
          default: return 0;
        }
      });
    }

    setState(prev => ({
      ...prev,
      filteredRegistrations: filteredRegs,
      filteredRegistrants: filteredRegsts
    }));
  }, [state.filters, state.registrations, state.registrants, state.eventConfig]);

  const updateFilter = <K extends keyof ExportFilters>(key: K, value: ExportFilters[K]) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }));
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
        teamName: 'all',
        ageGroup: 'all',
        gender: 'all',
        province: 'all',
        diocese: 'all',
        attendanceDay: 'all',
        sortBy: 'name',
        sortDirection: 'asc'
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t py-4">
            <div>
              <Label htmlFor="teamName">Lọc theo Ban</Label>
              <Select value={state.filters.teamName} onValueChange={(value) => updateFilter('teamName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả mọi người" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mọi người</SelectItem>
                  {state.availableTeams.map(team => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="ageGroup">Nhóm tuổi</Label>
              <Select value={state.filters.ageGroup} onValueChange={(value) => updateFilter('ageGroup', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả nhóm tuổi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhóm tuổi</SelectItem>
                  {AGE_GROUPS.map(ag => (
                    <SelectItem key={ag.value} value={ag.value}>{ag.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gender">Giới tính</Label>
              <Select value={state.filters.gender} onValueChange={(value) => updateFilter('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map(g => (
                    <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Extended filters row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t py-4">
            <div>
              <Label htmlFor="province">Tỉnh thành</Label>
              <Select value={state.filters.province} onValueChange={(value) => updateFilter('province', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả tỉnh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tỉnh</SelectItem>
                  {JAPANESE_PROVINCES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="diocese">Giáo phận</Label>
              <Select value={state.filters.diocese} onValueChange={(value) => updateFilter('diocese', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả giáo phận" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả giáo phận</SelectItem>
                  {state.availableDioceses.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="attendanceDay">Ngày tham gia</Label>
              <Select value={state.filters.attendanceDay} onValueChange={(value) => updateFilter('attendanceDay', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả ngày" />
                </SelectTrigger>
                <SelectContent>
                  {generateAttendanceDayOptions(state.eventConfig).map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortBy">Sắp xếp</Label>
              <Select value={state.filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tiêu chí" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort direction row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t py-4">
            <div></div>
            <div></div>
            <div></div>
            <div className="flex flex-col justify-end gap-1">
              <Label className="hidden md:block">&nbsp;</Label>
              <Button variant="outline" size="sm" onClick={() => updateFilter('sortDirection', state.filters.sortDirection === 'asc' ? 'desc' : 'asc')} className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                {state.filters.sortDirection === 'asc' ? 'Tăng dần' : 'Giảm dần'}
              </Button>
            </div>
          </div>

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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{state.filteredRegistrations.length}</div>
              <div className="text-sm text-muted-foreground">Tổng đăng ký</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalParticipants}</div>
              <div className="text-sm text-muted-foreground">Tổng người tham gia</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-muted-foreground">Tổng số tiền</div>
            </div>
          </div>
          
        </CardContent>
      </Card>


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
                    <th className="border border-gray-300 p-2 text-left">Đăng ký riêng</th>
                    <th className="border border-gray-300 p-2 text-left">Đi cùng</th>
                    <th className="border border-gray-300 p-2 text-left">Tỷ lệ %</th>
                  </tr>
                </thead>
                <tbody>
                  {generateProvinceStats(state.filteredRegistrations).map(({ province, total, individual, goWith }) => {
                    const overallTotal = state.filteredRegistrations.reduce((sum, reg) => sum + (reg.registrants?.length || 0), 0);
                    const percentage = overallTotal > 0 ? ((total / overallTotal) * 100).toFixed(1) : '0';
                    const provinceLabel = JAPANESE_PROVINCES.find(p => p.value === province)?.label || province;
                    return (
                      <tr key={province} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2 font-medium">{provinceLabel}</td>
                        <td className="border border-gray-300 p-2 text-center">{total}</td>
                        <td className="border border-gray-300 p-2 text-center">{individual}</td>
                        <td className="border border-gray-300 p-2 text-center">{goWith}</td>
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
              {state.filters.teamName !== 'all' && ` - Nhóm: ${state.filters.teamName}`}
              {state.filters.attendanceDay !== 'all' && state.eventConfig && (() => {
                const attendanceOptions = generateAttendanceDayOptions(state.eventConfig);
                const selectedOption = attendanceOptions.find(opt => opt.value === state.filters.attendanceDay);
                return selectedOption ? ` - ${selectedOption.label}` : '';
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Mã đăng ký</th>
                    <th className="border border-gray-300 p-2 text-left">Họ tên</th>
                    <th className="border border-gray-300 p-2 text-left">Fb/Email</th>
                    <th className="border border-gray-300 p-2 text-left">Giới tính</th>
                    <th className="border border-gray-300 p-2 text-left">Giáo phận</th>
                    <th className="border border-gray-300 p-2 text-left">Size áo</th>
                    <th className="border border-gray-300 p-2 text-left">Ngày tham gia</th>
                    <th className="border border-gray-300 p-2 text-left">Vai trò</th>
                    <th className="border border-gray-300 p-2 text-left">Nhóm</th>
                    <th className="border border-gray-300 p-2 text-left">Trạng thái đăng ký</th>
                  </tr>
                </thead>
                <tbody>
                  {state.filteredRegistrants.map((registrant) => (
                    <tr key={registrant.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 font-mono text-sm">
                        {registrant.registration?.invoice_code}
                      </td>
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
                        {(() => {
                          if (!registrant.second_day_only) {
                            return 'Tất cả ngày';
                          }
                          
                          if (registrant.selected_attendance_day && state.eventConfig) {
                            const selectedDate = new Date(registrant.selected_attendance_day);
                            
                            // Calculate which day number this is
                            const formattedDate = selectedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                            
                            return `Ngày (${formattedDate})`;
                          }
                          
                          return 'Chưa chọn';
                        })()}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {(() => {
                          const eventRole = registrant.event_roles?.name;
                          if (!eventRole) {
                            return 'Tham dự viên';
                          }
                          return eventRole;
                        })()}
                      </td>
                      <td className="border border-gray-300 p-2">
                        {(() => {
                          const teamName = registrant.event_roles?.team_name;
                          if (!teamName) {
                            return 'Tham dự viên';
                          }
                          return teamName;
                        })()}
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
                  <span className="font-medium">Tham dự viên:</span> {state.filteredRegistrants.filter(r => !r.event_role?.name && !r.event_role_id).length}
                </div>
                <div>
                  <span className="font-medium">Người chính:</span> {state.filteredRegistrants.filter(r => r.is_primary).length}
                </div>
              </div>
              
              {/* Show attendance day breakdown when not filtering by specific day */}
              {state.filters.attendanceDay === 'all' && state.eventConfig && (
                <div className="mt-3 pt-3 border-t">
                  <h5 className="font-medium mb-2">Thống kê ngày tham gia:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tất cả ngày:</span> {state.filteredRegistrants.filter(r => !r.second_day_only).length}
                    </div>
                    {generateAttendanceDayOptions(state.eventConfig)
                      .filter(option => option.value !== 'all')
                      .map(option => {
                        const count = state.filteredRegistrants.filter(r => 
                          r.second_day_only && r.selected_attendance_day === option.value
                        ).length;
                        return (
                          <div key={option.value}>
                            <span className="font-medium">Chỉ {option.label}:</span> {count}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
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