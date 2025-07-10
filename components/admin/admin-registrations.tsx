"use client";

import { RegistrationsList } from "@/components/admin/registrations-list";
import { useAdminData } from "@/components/admin/admin-context";

export function AdminRegistrations() {
  const { data, isLoading } = useAdminData();

  if (isLoading || !data) {
    return null; // Loading is handled by the layout
  }

  const userRole = data.userProfile?.role || 'participant';

  return (
    <RegistrationsList 
      registrations={data.recentRegistrations} 
      userRole={userRole}
    />
  );
}
