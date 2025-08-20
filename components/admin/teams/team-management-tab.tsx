"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Eye, UserMinus, MoreVertical, Edit, Trash2, Download } from "lucide-react";
import { formatAgeGroup } from "@/lib/utils";
import { CreateTeamModal } from "./create-team-modal";
import { EditTeamModal } from "./edit-team-modal";
import { ManageTeamMembersModal } from "./manage-team-members-modal";
import { TeamDetailModal } from "./team-detail-modal";
import { TeamListSkeleton } from "./team-skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { EventTeamWithDetails } from "@/lib/types";

export function TeamManagementTab() {
  const [teams, setTeams] = useState<EventTeamWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTeam, setEditTeam] = useState<EventTeamWithDetails | null>(null);
  const [manageTeam, setManageTeam] = useState<EventTeamWithDetails | null>(null);
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);
  const [exportingTeamId, setExportingTeamId] = useState<string | null>(null);

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

  const handleCreateTeamSuccess = (newTeam: EventTeamWithDetails) => {
    // Add new team to local state instead of refetching
    setTeams(prevTeams => [...prevTeams, { ...newTeam, member_count: newTeam.member_count || 0 }]);
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/teams?id=${deleteTeamId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Không thể xóa đội");
      }

      toast.success("Xóa đội thành công!");
      // Remove team from local state instead of refetching
      setTeams(prevTeams => prevTeams.filter(team => team.id !== deleteTeamId));
      setDeleteTeamId(null);
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = async (team: EventTeamWithDetails) => {
    setExportingTeamId(team.id);
    try {
      const response = await fetch(`/api/admin/teams/${team.id}/export`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể xuất file Excel');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Danh_sach_${team.name}_${new Date().toISOString().split('T')[0]}.xlsx`;

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

      toast.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi xuất file');
    } finally {
      setExportingTeamId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Quản lý đội</h2>
            <p className="text-muted-foreground">
              Quản lý thông tin và thành viên của các đội
            </p>
          </div>
          <Button disabled>
            <Users className="h-4 w-4 mr-2" />
            Tạo đội mới
          </Button>
        </div>
        <TeamListSkeleton />
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
        <div className="space-y-4">
          {teams.map((team) => (
            <Card key={team.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Left section: Team info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Users className="h-5 w-5 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-lg truncate">{team.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary">
                        {team.member_count}/{team.capacity || '∞'} người
                      </Badge>
                      {team.capacity && team.member_count / team.capacity > 0.8 && (
                        <Badge variant="destructive" className="text-xs">
                          {team.member_count >= team.capacity ? 'Đầy' : 'Gần đầy'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {team.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {team.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {/* Leader Info */}
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Trưởng nhóm:</span>
                      <span className="text-muted-foreground">
                        {team.leader ? team.leader.full_name : "Chưa có"}
                      </span>
                    </div>

                    {/* Sub Leader Info */}
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Phó nhóm:</span>
                      <span className="text-muted-foreground">
                        {team.sub_leader ? team.sub_leader.full_name : "Chưa có"}
                      </span>
                    </div>
                  </div>

                  {/* Age and Gender Distribution */}
                  <div className="flex flex-wrap gap-4 mt-3">
                    {team.age_breakdown && Object.keys(team.age_breakdown).length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Độ tuổi:</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(team.age_breakdown).map(([ageGroup, count]) => (
                            <Badge key={ageGroup} variant="secondary" className="text-xs">
                              {formatAgeGroup(ageGroup)}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {team.gender_breakdown && Object.keys(team.gender_breakdown).length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Giới tính:</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(team.gender_breakdown).map(([gender, count]) => (
                            <Badge key={gender} variant="outline" className="text-xs">
                              {gender === "male" ? "Nam" : "Nữ"}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right section: Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDetailTeamId(team.id)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Xem chi tiết
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportExcel(team)}
                    disabled={exportingTeamId === team.id || team.member_count === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    {exportingTeamId === team.id ? 'Đang xuất...' : 'Xuất Excel'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setManageTeam(team)}>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Quản lý thành viên
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTeam(team)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Sửa thông tin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteTeamId(team.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa đội
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateTeamSuccess}
      />

      <Dialog open={!!deleteTeamId} onOpenChange={() => setDeleteTeamId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa đội</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa đội này? Hành động này không thể hoàn tác.
              Tất cả thành viên trong đội sẽ trở thành người chưa được phân đội.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isDeleting} onClick={() => setDeleteTeamId(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleDeleteTeam}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Đang xóa..." : "Xóa đội"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditTeamModal
        isOpen={!!editTeam}
        onClose={() => setEditTeam(null)}
        onDataChange={(updatedTeam: EventTeamWithDetails) => {
          // Update team in local state instead of refetching
          setTeams(prevTeams =>
            prevTeams.map(team =>
              team.id === updatedTeam.id
                ? { ...team, ...updatedTeam, member_count: updatedTeam.member_count || team.member_count }
                : team
            )
          );
        }}
        team={editTeam}
      />

      <ManageTeamMembersModal
        isOpen={!!manageTeam}
        onClose={() => setManageTeam(null)}
        onMemberCountChange={(teamId, newCount) => {
          // Update only the member count for the specific team without full refresh
          setTeams(prevTeams =>
            prevTeams.map(team =>
              team.id === teamId
                ? { ...team, member_count: newCount }
                : team
            )
          );
        }}
        team={manageTeam}
      />

      <TeamDetailModal
        teamId={detailTeamId}
        isOpen={!!detailTeamId}
        onClose={() => setDetailTeamId(null)}
      />
    </div>
  );
}
