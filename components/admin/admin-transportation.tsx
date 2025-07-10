"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminData } from "@/components/admin/admin-context";
import { Truck, Plus, Users, MapPin } from "lucide-react";
import { toast } from "sonner";
import { TransportationGroup } from "@/lib/types";

export function AdminTransportation() {
  const { data, isLoading } = useAdminData();
  const [transportGroups, setTransportGroups] = useState<TransportationGroup[]>([]);
  const [isLoadingTransport, setIsLoadingTransport] = useState(true);

  useEffect(() => {
    fetchTransportationGroups();
  }, []);

  const fetchTransportationGroups = async () => {
    try {
      const response = await fetch('/api/admin/transportation');
      if (!response.ok) {
        throw new Error('Failed to fetch transportation groups');
      }
      const groups = await response.json();
      setTransportGroups(groups);
    } catch (error) {
      console.error('Error fetching transportation groups:', error);
      toast.error('Failed to load transportation groups');
    } finally {
      setIsLoadingTransport(false);
    }
  };

  if (isLoading || !data || isLoadingTransport) {
    return null; // Loading is handled by the layout
  }

  const userRole = data.userProfile?.role || 'participant';
  const userRegion = data.userProfile?.region;

  // Filter registrations for confirmed participants in the user's region
  const confirmedRegistrations = data.recentRegistrations.filter(
    reg => reg.status === 'confirmed' && 
    (userRole === 'super_admin' || 
     reg.registrants?.some(registrant => 
       // Check if any registrant has province in the user's region
       registrant.province && userRegion
     ))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý phương tiện</h2>
          <p className="text-muted-foreground">
            Tạo và quản lý các nhóm di chuyển cho người tham dự đã xác nhận
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tạo nhóm mới
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Người tham dự đã xác nhận
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedRegistrations.length}</div>
            <p className="text-xs text-muted-foreground">
              Trong khu vực của bạn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nhóm phương tiện
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transportGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              Đã tạo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đã đăng ký phương tiện
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transportGroups.reduce((sum, group) => sum + group.current_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Người tham dự
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transportation Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách nhóm phương tiện</CardTitle>
        </CardHeader>
        <CardContent>
          {transportGroups.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Chưa có nhóm phương tiện nào. Tạo nhóm đầu tiên để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transportGroups.map((group) => (
                <Card key={group.id} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{group.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-1" />
                      {group.departure_location}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Khởi hành:</span>
                      <span className="font-medium">
                        {new Date(group.departure_time).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Đã đăng ký:</span>
                      <span className="font-medium">
                        {group.current_count}/{group.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ 
                          width: `${Math.min((group.current_count / group.capacity) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        Xem chi tiết
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Chỉnh sửa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Người tham dự có thể đăng ký phương tiện</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Danh sách người tham dự đã xác nhận nhưng chưa đăng ký phương tiện
          </div>
          {confirmedRegistrations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Không có người tham dự nào đã xác nhận trong khu vực của bạn.
            </p>
          ) : (
            <div className="space-y-2">
              {confirmedRegistrations.slice(0, 10).map((registration) => (
                <div 
                  key={registration.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {registration.registrants?.[0]?.full_name || 'Unknown'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {registration.registrants?.[0]?.province || 'N/A'} - {registration.registrants?.[0]?.diocese || 'N/A'}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Thêm vào nhóm
                  </Button>
                </div>
              ))}
              {confirmedRegistrations.length > 10 && (
                <div className="text-center pt-4">
                  <Button variant="outline">
                    Xem thêm {confirmedRegistrations.length - 10} người
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
