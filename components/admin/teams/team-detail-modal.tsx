"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  User, 
  Calendar, 
  Mail, 
  Phone,
  MapPin,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle
} from "lucide-react";
import { formatAgeGroup, formatGender } from "@/lib/utils";
import { RoleBadgeCompact } from "@/components/ui/role-badge";

interface TeamMember {
  id: string;
  full_name: string;
  gender: string;
  age_group: string;
  province: string;
  diocese?: string;
  email?: string;
  phone?: string;
  registration?: {
    id: string;
    status: string;
    invoice_code: string;
    user: {
      id: string;
      full_name: string;
      email: string;
    };
  }[];
  event_role?: {
    id: string;
    name: string;
    description: string | null;
    team_name?: string | null;
    permissions: Record<string, unknown> | null;
    created_at?: string;
    updated_at?: string;
    event_config_id?: string;
  };
}

interface TeamInfo {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  leader_id?: string;
  sub_leader_id?: string;
  created_at: string;
  updated_at: string;
  leader?: {
    id: string;
    full_name: string;
    email: string;
  };
  sub_leader?: {
    id: string;
    full_name: string;
    email: string;
  };
  event_config?: {
    name: string;
    is_active: boolean;
  };
}

interface TeamStats {
  total_members: number;
  gender_distribution: Array<{ gender: string; count: number }>;
  age_distribution: Array<{ age_group: string; count: number }>;
  province_distribution: Array<{ province: string; count: number }>;
  status_distribution: Array<{ status: string; count: number }>;
}

interface TeamDetailModalProps {
  teamId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamDetailModal({ teamId, isOpen, onClose }: TeamDetailModalProps) {
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && teamId) {
      fetchTeamData();
    }
  }, [isOpen, teamId]);

  const fetchTeamData = async () => {
    if (!teamId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch team members and basic info
      const membersResponse = await fetch(`/api/admin/teams/${teamId}/members`);
      if (!membersResponse.ok) {
        throw new Error("Không thể tải thông tin đội");
      }
      const membersData = await membersResponse.json();
      
      // Fetch team statistics
      const statsResponse = await fetch(`/api/admin/teams/${teamId}/stats`);
      if (!statsResponse.ok) {
        throw new Error("Không thể tải thống kê đội");
      }
      const statsData = await statsResponse.json();
      
      setTeamInfo(membersData.team);
      setMembers(membersData.members || []);
      setStats(statsData.statistics);
    } catch (err) {
      console.error("Error fetching team data:", err);
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Đã xác nhận</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Chờ xác nhận</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
      case 'cancel_pending':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Chờ hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] w-[95vw] md:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="text-sm md:text-base">
              Chi tiết đội: {teamInfo?.name || "Đang tải..."}
            </span>
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải thông tin đội...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <Button variant="outline" size="sm" onClick={fetchTeamData} className="ml-auto">
              Thử lại
            </Button>
          </div>
        )}

        {!isLoading && !error && teamInfo && (
          <div className="space-y-6">
            {/* Team Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Thông tin đội
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{teamInfo.name}</h3>
                    {teamInfo.description && (
                      <p className="text-muted-foreground mt-1">{teamInfo.description}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>Tạo lúc: {formatDate(teamInfo.created_at)}</span>
                    </div>
                    {teamInfo.capacity && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4" />
                        <span>Sức chứa: {teamInfo.capacity} người</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Leadership */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Ban lãnh đạo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Trưởng nhóm</h4>
                    {teamInfo.leader ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{teamInfo.leader.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{teamInfo.leader.email}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Chưa có trưởng nhóm</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Phó nhóm</h4>
                    {teamInfo.sub_leader ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{teamInfo.sub_leader.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{teamInfo.sub_leader.email}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Chưa có phó nhóm</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Overview */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Thống kê tổng quan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.total_members}</div>
                      <div className="text-sm text-muted-foreground">Tổng thành viên</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.gender_distribution.find(g => g.gender === "Nam")?.count || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Nam</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600">
                        {stats.gender_distribution.find(g => g.gender === "Nữ")?.count || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Nữ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.status_distribution.find(s => s.status === "confirmed")?.count || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Đã xác nhận</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Members List */}
            {!isLoading && !error && members.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Danh sách thành viên ({members.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.full_name}</span>
                              {member.event_role && (
                                <RoleBadgeCompact role={member.event_role} />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatGender(member.gender)}</span>
                              <span>{formatAgeGroup(member.age_group)}</span>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{member.province}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {member.registration?.[0] && (
                              <div className="flex items-center gap-2">
                                {getStatusBadge(member.registration[0].status)}
                                <span className="text-xs text-muted-foreground">
                                  #{member.registration[0].invoice_code}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact Info */}
                        {(member.email || member.phone) && (
                          <div className="flex flex-wrap gap-4 text-sm">
                            {member.email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{member.phone}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Diocese info */}
                        {member.diocese && (
                          <div className="text-sm text-muted-foreground">
                            Giáo phận: {member.diocese}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state for no members */}
            {!isLoading && !error && members.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chưa có thành viên</h3>
                  <p className="text-muted-foreground">
                    Đội này chưa có thành viên nào được phân công.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Distribution Charts */}
            {stats && stats.total_members > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Phân bố độ tuổi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.age_distribution.map((item) => (
                        <div key={item.age_group} className="flex items-center justify-between">
                          <span className="text-sm">{formatAgeGroup(item.age_group)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(item.count / stats.total_members) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Province Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Phân bố tỉnh thành</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.province_distribution.slice(0, 5).map((item) => (
                        <div key={item.province} className="flex items-center justify-between">
                          <span className="text-sm">{item.province}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(item.count / stats.total_members) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                          </div>
                        </div>
                      ))}
                      {stats.province_distribution.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          Và {stats.province_distribution.length - 5} tỉnh thành khác...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
