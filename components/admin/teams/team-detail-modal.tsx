"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  UserX,
  Loader2,
  AlertCircle,
  Download
} from "lucide-react";
import { formatAgeGroup, formatGender } from "@/lib/utils";
import { RoleBadgeCompact } from "@/components/ui/role-badge";

// Format Facebook URL for display
const formatFacebookUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove protocol and www for cleaner display
    let displayUrl = urlObj.hostname + urlObj.pathname;
    if (displayUrl.startsWith('www.')) {
      displayUrl = displayUrl.substring(4);
    }
    // Truncate if too long
    if (displayUrl.length > 35) {
      displayUrl = displayUrl.substring(0, 32) + '...';
    }
    return displayUrl;
  } catch {
    // If URL is invalid, just truncate the original
    return url.length > 35 ? url.substring(0, 32) + '...' : url;
  }
};

interface TeamMember {
  id: string;
  full_name: string;
  gender: string;
  age_group: string;
  province: string;
  diocese?: string;
  email?: string;
  phone?: string;
  facebook_link?: string;
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
  gender: Array<{ gender: string; count: number }>;
  age: Array<{ age_group: string; count: number }>;
  province: Array<{ province: string; count: number }>;
  registration_status: Array<{ status: string; count: number }>;
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
  const [isExporting, setIsExporting] = useState(false);

  const fetchTeamData = useCallback(async () => {
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
      setStats(statsData.distributions);
    } catch (err) {
      console.error("Error fetching team data:", err);
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (isOpen && teamId) {
      fetchTeamData();
    }
  }, [isOpen, teamId, fetchTeamData]);

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

  const getGenderRatio = () => {
    if (!stats || !stats.gender || stats.gender.length === 0) {
      return "Chưa có dữ liệu";
    }

    const totalMembers = stats.gender.reduce((sum, item) => sum + item.count, 0);
    if (totalMembers === 0) {
      return "Chưa có thành viên";
    }

    const maleData = stats.gender.find(g => g.gender === "Nam");
    const femaleData = stats.gender.find(g => g.gender === "Nữ");

    const maleCount = maleData?.count || 0;
    const femaleCount = femaleData?.count || 0;

    const malePercent = totalMembers > 0 ? Math.round((maleCount / totalMembers) * 100) : 0;
    const femalePercent = totalMembers > 0 ? Math.round((femaleCount / totalMembers) * 100) : 0;

    return `Nam: ${maleCount} người (${malePercent}%) - Nữ: ${femaleCount} người (${femalePercent}%)`;
  };

  const handleExportExcel = async () => {
    if (!teamInfo || !teamId) return;

    setIsExporting(true);
    try {
      const response = await fetch(`/api/admin/teams/${teamId}/export`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể xuất file Excel');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Danh_sach_${teamInfo.name}_${new Date().toISOString().split('T')[0]}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xuất file');
    } finally {
      setIsExporting(false);
    }
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
            {/* Team Info - Combined with Leadership */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Thông tin đội
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Team Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{teamInfo.name}</h3>
                    {teamInfo.description && (
                      <p className="text-muted-foreground mt-1">{teamInfo.description}</p>
                    )}
                    {/* Export Excel Button */}
                    <div className="mt-3">
                      <Button
                        onClick={handleExportExcel}
                        disabled={isExporting || !members || members.length === 0}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span>
                        Số thành viên: {stats?.gender ? stats.gender.reduce((sum, item) => sum + item.count, 0) : 0}
                        {teamInfo.capacity && ` / ${teamInfo.capacity}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span>{getGenderRatio()}</span>
                    </div>
                  </div>
                </div>

                {/* Leadership Info */}
                <div className="border-t pt-4">
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
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.gender ? stats.gender.reduce((sum, item) => sum + item.count, 0) : 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Tổng thành viên</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.gender?.find(g => g.gender === "Nam")?.count || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Nam</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600">
                        {stats.gender?.find(g => g.gender === "Nữ")?.count || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Nữ</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.registration_status?.find(s => s.status === "confirmed")?.count || 0}
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
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between gap-3">
                          {/* Main Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{member.full_name}</span>
                              {member.event_role && (
                                <RoleBadgeCompact role={member.event_role} />
                              )}
                            </div>

                            {/* Compact Info Row */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <span className={member.gender === 'male' ? 'text-blue-600' : 'text-pink-600'}>
                                  {member.gender === 'male' ? '♂' : '♀'}
                                </span>
                                {formatGender(member.gender)}
                              </span>
                              <span>{formatAgeGroup(member.age_group)}</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {member.province}
                              </span>
                              {member.diocese && (
                                <span>GP: {member.diocese}</span>
                              )}
                            </div>

                            {/* Contact Info - Compact */}
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                              {member.email && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {member.email}
                                </span>
                              )}
                              {member.phone && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {member.phone}
                                </span>
                              )}
                              {member.facebook_link && (
                                <a
                                  href={member.facebook_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                  title={member.facebook_link}
                                >
                                  <span>📘</span>
                                  {formatFacebookUrl(member.facebook_link)}
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Status */}
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
            {stats && stats.gender && stats.gender.reduce((sum, item) => sum + item.count, 0) > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Age Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Phân bố độ tuổi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.age?.map((item) => (
                        <div key={item.age_group} className="flex items-center justify-between">
                          <span className="text-sm">{formatAgeGroup(item.age_group)}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(item.count / (stats.gender?.reduce((sum, g) => sum + g.count, 0) || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                          </div>
                        </div>
                      )) || []}
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
                      {stats.province?.slice(0, 5).map((item) => (
                        <div key={item.province} className="flex items-center justify-between">
                          <span className="text-sm">{item.province}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(item.count / (stats.gender?.reduce((sum, g) => sum + g.count, 0) || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                          </div>
                        </div>
                      )) || []}
                      {stats.province && stats.province.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          Và {stats.province.length - 5} tỉnh thành khác...
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
