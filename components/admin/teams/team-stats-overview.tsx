"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, UserPlus, UserCheck, TrendingUp, Users } from "lucide-react";
import { formatAgeGroup } from "@/lib/utils";

interface TeamStats {
  overview: {
    total_teams: number;
    total_assigned: number;
    total_unassigned: number;
  };
  team_distribution: Array<{
    team_name: string;
    count: number;
  }>;
  gender_distribution: Array<{
    gender: string;
    count: number;
  }>;
  age_distribution: Array<{
    age_group: string;
    count: number;
  }>;
  role_distribution: Array<{
    role_name: string;
    role_category: string;
    count: number;
  }>;
}

export function TeamStatsOverview() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/teams/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không thể tải thống kê
      </div>
    );
  }

  const totalParticipants = stats.overview.total_assigned + stats.overview.total_unassigned;
  const assignmentRate = totalParticipants > 0 
    ? Math.round((stats.overview.total_assigned / totalParticipants) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600">{stats.overview.total_teams}</div>
              <div className="text-sm text-muted-foreground">Tổng số đội</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600">{stats.overview.total_assigned}</div>
              <div className="text-sm text-muted-foreground">Đã phân đội</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <UserPlus className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-orange-600">{stats.overview.total_unassigned}</div>
              <div className="text-sm text-muted-foreground">Chưa phân đội</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <div className="text-2xl font-bold text-purple-600">{assignmentRate}%</div>
              <div className="text-sm text-muted-foreground">Tỷ lệ phân đội</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="w-full space-y-6">
        {/* Desktop: 2x2 Grid layout */}
        <div className="hidden md:block">
          {/* Hàng trên: Team và Role Distribution (nhiều thông tin) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Team Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Phân bố theo đội
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.team_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {stats.team_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{item.team_name}</span>
                        <Badge variant="secondary">{item.count} người</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Phân bố theo vai trò
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.role_distribution && stats.role_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {stats.role_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.role_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.role_category}
                          </Badge>
                        </div>
                        <Badge variant="secondary">{item.count} người</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Hàng dưới: Gender và Age Distribution (thông tin ngắn gọn) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo giới tính</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.gender_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {stats.gender_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{item.gender}</span>
                        <Badge variant="secondary">{item.count} người</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo độ tuổi</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.age_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {stats.age_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{formatAgeGroup(item.age_group)}</span>
                        <Badge variant="secondary">{item.count} người</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Team Distribution */}
            <Card className="flex-shrink-0 w-80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Phân bố theo đội
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.team_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {stats.team_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{item.team_name}</span>
                        <Badge variant="secondary">{item.count} người</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role Distribution */}
            <Card className="flex-shrink-0 w-80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Phân bố theo vai trò
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.role_distribution && stats.role_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {stats.role_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.role_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.role_category}
                          </Badge>
                        </div>
                        <Badge variant="secondary">{item.count} người</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card className="flex-shrink-0 w-80">
              <CardHeader>
                <CardTitle>Phân bố theo giới tính</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.gender_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {stats.gender_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{item.gender}</span>
                        <Badge variant="secondary">{item.count} người</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Age Distribution */}
            <Card className="flex-shrink-0 w-80">
              <CardHeader>
                <CardTitle>Phân bố theo độ tuổi</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.age_distribution.length > 0 ? (
                  <div className="space-y-2">
                    {stats.age_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{formatAgeGroup(item.age_group)}</span>
                        <Badge variant="secondary">{item.count} người</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có dữ liệu
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tóm tắt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">Tình trạng phân đội</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng số người tham dự:</span>
                    <span className="font-medium">{totalParticipants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đã được phân đội:</span>
                    <span className="font-medium">{stats.overview.total_assigned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chưa được phân đội:</span>
                    <span className="font-medium">{stats.overview.total_unassigned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tỷ lệ hoàn thành:</span>
                    <span className="font-medium">{assignmentRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đội có nhiều thành viên nhất</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.team_distribution.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="font-medium">{stats.team_distribution[0].team_name}</span>
                  </div>
                  <Badge variant="secondary">{stats.team_distribution[0].count} người</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
