"use client";

import { EventConfigManager } from "@/components/admin/event-config-manager";
import { useAdminData } from "@/components/admin/admin-context";

export function AdminEvents() {
  const { data, isLoading } = useAdminData();

  if (isLoading || !data) {
    return null; // Loading is handled by the layout
  }

  const userRole = data.userProfile?.role || 'participant';

  return (
    <EventConfigManager currentUserRole={userRole} />
  );
}
