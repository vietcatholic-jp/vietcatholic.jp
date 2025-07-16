"use client";

import { createContext, useContext, ReactNode } from "react";
import { Registration, UserRole, RegionType } from "@/lib/types";

interface AdminData {
  stats: {
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    totalParticipants: number;
  };
  recentRegistrations: Registration[];
  regionalStats?: { region: string; count: number }[];
  userProfile?: {
    role: UserRole;
    region?: RegionType;
  };
  provinceStats?: { province: string; count: number }[];
  dioceseStats?: { diocese: string; count: number }[];
  roleStats?: { event_role: string; count: number }[];
}

interface AdminContextType {
  data: AdminData | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdminData() {
  const context = useContext(AdminContext);
  console.log("useAdminData context:", context);
  if (context === undefined) {
    throw new Error('useAdminData must be used within an AdminProvider');
  }
  return context;
}

export function AdminProvider({ 
  children, 
  data, 
  isLoading, 
  refreshData 
}: { 
  children: ReactNode;
  data: AdminData | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}) {
  return (
    <AdminContext.Provider value={{ data, isLoading, refreshData }}>
      {children}
    </AdminContext.Provider>
  );
}
