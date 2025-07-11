"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegistrationManagerStats } from "./RegistrationManagerStats";
import { RegistrationManagerList } from "./RegistrationManagerList";
import { CancelRequestsManager } from "./CancelRequestsManager";
import { 
  BarChart3, 
  Users, 
  XCircle,
  Loader2
} from "lucide-react";
import { Registration, CancelRequest } from "@/lib/types";
import { toast } from "sonner";

interface RegistrationManagerData {
  stats: {
    totalRegistrations: number;
    pendingPayments: number;
    confirmedRegistrations: number;
    rejectedPayments: number;
    cancelRequests: number;
    totalAmount: number;
    confirmedAmount: number;
  };
  registrations: Registration[];
  cancelRequests: CancelRequest[];
}

export function RegistrationManagerDashboard() {
  const [data, setData] = useState<RegistrationManagerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/registration-manager');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching registration manager data:', error);
      toast.error('Failed to load registration data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDataRefresh = () => {
    fetchData();
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
          <p className="text-muted-foreground">Failed to load registration data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Quản lý đăng ký</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin đăng ký, xác nhận thanh toán và xử lý yêu cầu hủy
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Đăng ký
            </TabsTrigger>
            <TabsTrigger value="cancellations" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Yêu cầu hủy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <RegistrationManagerStats stats={data.stats} />
          </TabsContent>

          <TabsContent value="registrations" className="mt-6">
            <RegistrationManagerList 
              registrations={data.registrations}
              onDataRefresh={handleDataRefresh}
            />
          </TabsContent>

          <TabsContent value="cancellations" className="mt-6">
            <CancelRequestsManager 
              cancelRequests={data.cancelRequests}
              onDataRefresh={handleDataRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
