"use client";

import { OrganizerTools } from "@/components/admin/organizer-tools";
import { useAdminData } from "@/components/admin/admin-context";

export function AdminTools() {
  const { data, isLoading } = useAdminData();

  if (isLoading || !data) {
    return null; // Loading is handled by the layout
  }

  const userRole = data.userProfile?.role || 'participant';

  return (
    <OrganizerTools 
      registrations={data.recentRegistrations} 
      userRole={userRole}
    />
  );
}
