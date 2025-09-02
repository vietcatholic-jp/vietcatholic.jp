"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Eye, MapPin, Phone } from "lucide-react";
import { Registration } from "@/lib/types";
import { useRoles } from "@/lib/hooks/use-roles";
import { formatRoleForDisplay } from "@/lib/role-utils";
import { toast } from "sonner";

export function GroupLeaderRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { roles } = useRoles();
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchGroupRegistrations();
  }, []);

  const fetchGroupRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/group-leader-registrations');
      if (!response.ok) {
        throw new Error('Failed to fetch group registrations');
      }
      const data = await response.json();
      setRegistrations(data.registrations);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Error fetching group registrations:', error);
      toast.error('Failed to load group registrations');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return formatRoleForDisplay(role);
  };

  const getRoleBadgeColor = (roleValue: string) => {
    if (roleValue.includes('organizer')) return 'bg-purple-500';
    if (roleValue.includes('volunteer')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Quản lý nhóm của bạn</h2>
        <p className="text-muted-foreground">
          Danh sách các thành viên đã xác nhận trong nhóm bạn phụ trách ({totalCount} người)
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số thành viên
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Đã xác nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ban tổ chức
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.reduce((sum, reg) =>
                sum + (reg.registrants?.filter(r => r.event_role?.name?.toLowerCase().includes('organizer')).length || 0), 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Thành viên ban tổ chức
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tình nguyện viên
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.reduce((sum, reg) =>
                sum + (reg.registrants?.filter(r => r.event_role?.name?.toLowerCase().includes('volunteer')).length || 0), 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tình nguyện viên
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Registrations List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thành viên nhóm</CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chưa có thành viên nào trong nhóm của bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((registration) => (
                <Card key={registration.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          #{registration.invoice_code}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {registration.user?.full_name || registration.user?.email}
                        </p>
                      </div>
                      <Badge className="bg-green-500">Đã xác nhận</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Registrants */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm">Thành viên ({registration.registrants?.length || 0}):</h5>
                      <div className="grid gap-3">
                        {registration.registrants?.map((registrant) => (
                          <div 
                            key={registrant.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{registrant.full_name}</span>
                                {registrant.is_primary && (
                                  <Badge variant="outline" className="text-xs">Chính</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-4">
                                  {registrant.province && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {registrant.province}
                                    </span>
                                  )}
                                  {registrant.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {registrant.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`text-xs ${getRoleBadgeColor(registrant.event_role?.name || 'participant')}`}
                              >
                                {getRoleLabel(registrant.event_role?.name || 'participant')}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-3 mt-3 border-t">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
