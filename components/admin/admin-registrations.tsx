"use client";

import { RegistrationsList } from "@/components/admin/registrations-list";
import { GroupLeaderRegistrations } from "@/components/admin/group-leader-registrations";
import { useAdminData } from "@/components/admin/admin-context";

export function AdminRegistrations() {
  const { data, isLoading } = useAdminData();

  if (isLoading || !data) {
    return null; // Loading is handled by the layout
  }

  const userRole = data.userProfile?.role || 'participant';

  // Group leaders get a specialized view
  if (userRole === 'group_leader') {
    return <GroupLeaderRegistrations />;
  }

  // Other admin roles get the standard registrations list
  return (
    <RegistrationsList 
      registrations={data.recentRegistrations} 
      userRole={userRole}
    />
  );
}
