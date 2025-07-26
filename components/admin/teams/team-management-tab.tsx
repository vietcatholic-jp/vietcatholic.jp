"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Settings, Eye, UserMinus } from "lucide-react";
import { formatAgeGroup } from "@/lib/utils";
import { CreateTeamModal } from "./create-team-modal";

interface Team {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  member_count: number;
  leader?: {
    id: string;
    full_name: string;
  };
  sub_leader?: {
    id: string;
    full_name: string;
  };
  age_breakdown?: Record<string, number>;
  gender_breakdown?: Record<string, number>;
}

export function TeamManagementTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/teams");
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeamSuccess = () => {
    fetchTeams(); // Refresh teams list
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Đang tải danh sách đội...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý đội</h2>
          <p className="text-muted-foreground">
            Quản lý thông tin và thành viên của các đội
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Users className="h-4 w-4 mr-2" />
          Tạo đội mới
        </Button>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có đội nào</h3>
            <p className="text-muted-foreground mb-4">
              Bắt đầu bằng cách tạo đội đầu tiên cho sự kiện
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Tạo đội đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {team.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {team.member_count}/{team.capacity || '∞'} người
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {team.description && (
                  <p className="text-sm text-muted-foreground">{team.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Leader Info */}
                  <div>
                    <div className="text-sm font-medium mb-1">Trưởng nhóm</div>
                    <div className="text-sm text-muted-foreground">
                      {team.leader ? team.leader.full_name : "Chưa có"}
                    </div>
                  </div>

                  {/* Sub Leader Info */}
                  <div>
                    <div className="text-sm font-medium mb-1">Phó nhóm</div>
                    <div className="text-sm text-muted-foreground">
                      {team.sub_leader ? team.sub_leader.full_name : "Chưa có"}
                    </div>
                  </div>
                </div>

                {/* Age Distribution */}
                {team.age_breakdown && Object.keys(team.age_breakdown).length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Phân bố độ tuổi</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(team.age_breakdown).map(([ageGroup, count]) => (
                        <Badge key={ageGroup} variant="secondary" className="text-xs">
                          {formatAgeGroup(ageGroup)}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gender Distribution */}
                {team.gender_breakdown && Object.keys(team.gender_breakdown).length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Phân bố giới tính</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(team.gender_breakdown).map(([gender, count]) => (
                        <Badge key={gender} variant="outline" className="text-xs">
                          {gender === "male" ? "Nam" : "Nữ"}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Xem chi tiết
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <UserMinus className="h-4 w-4 mr-1" />
                    Quản lý thành viên
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateTeamSuccess}
      />
    </div>
  );
}
