"use client";

import { useAdminData } from "@/components/admin/admin-context";
import { DiocesesChart } from "@/components/admin/dioceses-chart";
import { ProvincesChart } from "@/components/admin/provinces-chart";
import { RolesChart } from "@/components/admin/roles-chart";

export function AdminOverview() {
  const { data, isLoading } = useAdminData();

  if (isLoading || !data) {
    return null; // Loading is handled by the layout
  }

  return (
    <div className="space-y-6">
      {/* Province Stats (for super admin) */}
      {data.provinceStats && (
        <ProvincesChart provinceStats={data.provinceStats} />
      )}

      {/* Diocese Stats (for super admin) */}
      {data.dioceseStats && (
        <DiocesesChart dioceseStats={data.dioceseStats} />
      )}

      {/* Event Role Stats (for super admin) */}
      {data.roleStats && (
        <RolesChart roleStats={data.roleStats} />
      )}
    </div>
  );
}
