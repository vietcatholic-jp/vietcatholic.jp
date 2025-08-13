"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, DollarSign, Banknote, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { CancelRequestsManager } from '../admin/registration-manager/CancelRequestsManager';
import { RegistrationManagerList } from '../admin/registration-manager/RegistrationManagerList';
import { CancelRequest, Registration, EventConfig, RegistrationStatus } from '@/lib/types';

interface EventConfigLite { id: string; is_active?: boolean; name?: string }

interface RegistrationManagerAPI {
  registrations: Registration[];
  totalPages: number;
  cancelRequests?: CancelRequest[];
}

export default function CashierDashboard() {
  // Registrations list state (replaces card-based payments list)
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  // Default to report_paid so cashiers see items needing confirmation
  const [statusFilter, setStatusFilter] = useState<'all' | RegistrationStatus>('report_paid');
  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventConfig, setEventConfig] = useState<EventConfigLite | null>(null);

  // Load registration list for cashier view
  const loadRegistrations = async (
    page = 1,
    search = '',
    status: 'all' | RegistrationStatus = statusFilter
  ) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search,
        status,
      });
      const response = await fetch(`/api/admin/registration-manager?${params.toString()}`);
      if (!response.ok) throw new Error('Không thể tải danh sách đăng ký');
      const data: RegistrationManagerAPI = await response.json();
      setRegistrations(data.registrations || []);
      setTotalPages(data.totalPages || 1);
      // If endpoint also supplies cancelRequests, use it for refunds tab
      if (data.cancelRequests) setCancelRequests(data.cancelRequests);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataRefresh = () => {
    loadRegistrations(currentPage, searchTerm, statusFilter);
  };

  // Load event config
  useEffect(() => {
    const fetchEventConfig = async () => {
      try {
        const response = await fetch('/api/admin/events');
        if (response.ok) {
          const { events } = await response.json();
          const activeEvent = (events || []).find((event: EventConfigLite) => event.is_active);
          setEventConfig(activeEvent || null);
        }
      } catch (error) {
        console.error('Failed to fetch event config:', error);
      }
    };

    fetchEventConfig();
  }, []);

  useEffect(() => {
    if (eventConfig) {
      loadRegistrations(1, searchTerm, statusFilter);
      // Auto refresh can be enabled if needed
      // const interval = setInterval(() => loadRegistrations(currentPage, searchTerm, statusFilter), 30000);
      // return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventConfig]);

  const formatJPY = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Đang tải dữ liệu từ hệ thống...</AlertDescription>
        </Alert>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thanh toán chờ xác nhận</CardTitle>
              {/* icon removed */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Đang tải...</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoàn tiền chờ xử lý</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Đang tải...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thanh toán chờ xác nhận</CardTitle>
            {/* icon removed */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{registrations.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatJPY(registrations.reduce((sum, r) => sum + (r.total_amount || 0), 0))} tổng giá trị (trang hiện tại)
            </p>
            {registrations.length > 0 && (
              <Badge variant="destructive" className="mt-2">
                Cần xử lý ngay
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn tiền chờ xử lý</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{cancelRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatJPY(cancelRequests.reduce((sum, c) => sum + c.refund_amount, 0))} tổng hoàn tiền
            </p>
            {cancelRequests.length > 0 && (
              <Badge variant="default" className="mt-2 bg-blue-50 text-blue-700">
                <DollarSign className="h-3 w-3 mr-1" />
                Sẵn sàng chuyển khoản
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments" className="relative">
            Xác nhận thanh toán ({registrations.length})
            {registrations.length > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {registrations.length}
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger value="refunds">
            Xử lý hoàn tiền ({cancelRequests.length})
            {cancelRequests.length > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                {cancelRequests.length}
              </div>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <RegistrationManagerList
            registrations={registrations}
            currentPage={currentPage}
            totalPages={totalPages}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            isLoading={isLoading}
            eventConfig={eventConfig as EventConfig | null}
            onDataRefresh={handleDataRefresh}
            onSearch={(search) => {
              setSearchTerm(search);
              setCurrentPage(1);
              loadRegistrations(1, search, statusFilter);
            }}
            onStatusFilter={(status) => {
              const s = status as 'all' | RegistrationStatus;
              setStatusFilter(s);
              setCurrentPage(1);
              loadRegistrations(1, searchTerm, s);
            }}
            onPageChange={(page) => {
              setCurrentPage(page);
              loadRegistrations(page, searchTerm, statusFilter);
            }}
            // Cashier can only toggle between these statuses
            allowedStatuses={['pending', 'confirm_paid', 'payment_rejected']}
            // Hide registrant fields for cashier, only status + notes
            onlyStatusEditing
          />
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          {cancelRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                  <p className="text-sm">Hiện tại không có yêu cầu hoàn tiền nào cần xử lý</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <CancelRequestsManager cancelRequests={cancelRequests} onDataRefresh={handleDataRefresh} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}