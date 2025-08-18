"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegistrationManagerStats } from "./RegistrationManagerStats";
import { RegistrationManagerList } from "./RegistrationManagerList";
//import { CancelRequestsManager } from "./CancelRequestsManager";
import { QuickActions } from "./QuickActions";
import { 
  BarChart3, 
  Users, 
  Loader2,
  RefreshCw
} from "lucide-react";
import { Registration, CancelRequest, EventConfig } from "@/lib/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface RegistrationManagerData {
  stats: {
    total_registrations: number;
    pending_payments: number;
    confirmed_registrations: number;
    rejected_payments: number;
    cancel_requests: number;
    total_amount: number;
    confirmed_amount: number;
  };
  registrations: Registration[];
  cancelRequests: CancelRequest[];
  totalPages: number;
}

export function RegistrationManagerDashboard() {
  const [data, setData] = useState<RegistrationManagerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [eventConfig, setEventConfig] = useState<EventConfig | null>(null);

  // Fetch active event config and roles
    useEffect(() => {
      const fetchEventData = async () => {
        //setIsLoadingRoles(true);
        try {
          //TODO: Should get the event that belongs to the current registration manager
          const response = await fetch('/api/admin/events');
          if (response.ok) {
            const { events } = await response.json();
            const activeEvent = events?.find((event: EventConfig) => event.is_active);
            setEventConfig(activeEvent || events[0] || null);
          }
        } catch (error) {
          console.error('Failed to fetch event data:', error);
        } finally {
         // setIsLoadingRoles(false);
        }
      };
  
      fetchEventData();
    }, []);

  const fetchData = async (page = 1, search = "", status = "all", showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
        status,
      });
      
      const response = await fetch(`/api/admin/registration-manager?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching registration manager data:', error);
      toast.error('Failed to load registration data');
    } finally {
      setCurrentPage(page);
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter]);

  const handleDataRefresh = () => {
    fetchData(currentPage, searchTerm, statusFilter, false);
  };

  const handleManualRefresh = () => {
    fetchData(currentPage, searchTerm, statusFilter, false);
    toast.success('Dữ liệu đã được làm mới');
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    console.log("Search term:", search);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "registrations") {
      setStatusFilter("report_paid");
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    console.log("Status filter:", status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    fetchData(page, searchTerm, statusFilter);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Không có dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Quản lý đăng ký</h1>
              <p className="text-muted-foreground mt-2">
                Quản lý thông tin đăng ký, xác nhận đóng phí tham dự và xử lý yêu cầu hủy
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastRefresh && (
                <span className="text-sm text-muted-foreground">
                  Cập nhật lần cuối: {lastRefresh.toLocaleTimeString('vi-VN')}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 hidden sm:flex" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <Users className="h-4 w-4 hidden sm:flex" />
              Đăng ký
            </TabsTrigger>
            {/*<TabsTrigger value="cancellations" className="flex items-center gap-2">
              <XCircle className="h-4 w-4 hidden sm:flex" />
              Yêu cầu hủy
            </TabsTrigger>*/}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <RegistrationManagerStats stats={data.stats} />
              <QuickActions stats={data.stats} onTabChange={handleTabChange} />
            </div>
          </TabsContent>

          <TabsContent value="registrations" className="mt-6">
            <RegistrationManagerList 
              registrations={data.registrations}
              currentPage={currentPage}
              totalPages={data.totalPages}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              eventConfig={eventConfig}
              onDataRefresh={handleDataRefresh}
              onSearch={handleSearch}
              onStatusFilter={handleStatusFilter}
              onPageChange={handlePageChange}
              allowedStatuses={['confirmed', 'temp_confirmed', 'be_cancelled']}
              isLoading={isLoading}
            />
          </TabsContent>

          {/*<TabsContent value="cancellations" className="mt-6">
            <CancelRequestsManager 
              cancelRequests={data.cancelRequests}
              onDataRefresh={handleDataRefresh}
            />
          </TabsContent>*/}
        </Tabs>
      </div>
    </div>
  );
}
