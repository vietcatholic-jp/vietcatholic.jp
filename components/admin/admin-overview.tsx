"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminData } from "@/components/admin/admin-context";
import { DiocesesChart } from "@/components/admin/dioceses-chart";
import { ProvincesChart } from "@/components/admin/provinces-chart";

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
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo vai trò</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.roleStats.map((stat) => (
                <div key={stat.event_role} className="text-center">
                  <div className="font-semibold text-lg">{stat.count}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {stat.event_role.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
