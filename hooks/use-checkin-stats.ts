"use client";

import { useState, useEffect } from "react";
import { Registration } from "@/lib/types";

interface CheckInStats {
  totalCheckedIn: number;
  waitingCheckIn: number;
  totalConfirmed: number;
}

export function useCheckInStats() {
  const [stats, setStats] = useState<CheckInStats>({
    totalCheckedIn: 0,
    waitingCheckIn: 0,
    totalConfirmed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/export?type=registrations');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      const registrations: Registration[] = data.registrations || [];
      
      // Calculate check-in statistics
      const totalCheckedIn = registrations.reduce((sum, reg) => 
        sum + (reg.registrants?.filter(r => r.is_checked_in === true).length || 0), 0
      );
      
      // Count registrants who are expected to attend but haven't checked in yet
      const waitingCheckIn = registrations.reduce((sum, reg) => {
        if (['confirm_paid', 'confirmed', 'checked_in', 'checked_out'].includes(reg.status)) {
          return sum + (reg.registrants?.filter(r => r.is_checked_in !== true).length || 0);
        }
        return sum;
      }, 0);
      
      // Total confirmed registrants
      const totalConfirmed = registrations.reduce((sum, reg) => {
        if (['confirm_paid', 'confirmed', 'checked_in', 'checked_out'].includes(reg.status)) {
          return sum + (reg.registrants?.length || 0);
        }
        return sum;
      }, 0);
      
      setStats({
        totalCheckedIn,
        waitingCheckIn,
        totalConfirmed
      });
      
    } catch (err) {
      console.error('Error fetching check-in stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}
