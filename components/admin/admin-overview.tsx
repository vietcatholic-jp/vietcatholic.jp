"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminData } from "@/components/admin/admin-context";

export function AdminOverview() {
  const { data, isLoading } = useAdminData();

  if (isLoading || !data) {
    return null; // Loading is handled by the layout
  }

  return (
    <div className="space-y-6">
      {/* Province Stats (for super admin) */}
      {data.provinceStats && (
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo tỉnh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.provinceStats.map((stat) => (
                <div key={stat.province} className="text-center">
                  <div className="font-semibold text-lg">{stat.count}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {stat.province}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diocese Stats (for super admin) */}
      {data.dioceseStats && (
        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo giáo phận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.dioceseStats.map((stat) => (
                <div key={stat.diocese} className="text-center">
                  <div className="font-semibold text-lg">{stat.count}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {stat.diocese}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
