"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Registration } from "@/lib/types";
import { toast } from "sonner";

interface AnalyticsFilters {
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
  reportType: string;
}

interface AnalyticsContextType {
  registrations: Registration[];
  filteredRegistrations: Registration[];
  filters: AnalyticsFilters;
  loading: boolean;
  updateFilter: <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => void;
  clearFilters: () => void;
  refreshData: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

interface AnalyticsProviderProps {
  children: ReactNode;
  apiEndpoint?: string;
}

export function AnalyticsProvider({ 
  children, 
  apiEndpoint = '/api/admin/export' 
}: AnalyticsProviderProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    reportType: 'summary'
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiEndpoint}?type=registrations`);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...registrations];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(reg => reg.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(reg => new Date(reg.created_at) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(reg => new Date(reg.created_at) <= toDate);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(reg => 
        reg.invoice_code.toLowerCase().includes(searchTerm) ||
        reg.user?.full_name?.toLowerCase().includes(searchTerm) ||
        reg.user?.email?.toLowerCase().includes(searchTerm) ||
        reg.registrants?.some(r => r.full_name.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredRegistrations(filtered);
  }, [filters, registrations]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [apiEndpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: '',
      reportType: 'summary'
    });
  };

  const refreshData = async () => {
    await fetchData();
  };

  return (
    <AnalyticsContext.Provider value={{
      registrations,
      filteredRegistrations,
      filters,
      loading,
      updateFilter,
      clearFilters,
      refreshData
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}