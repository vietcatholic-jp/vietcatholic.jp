"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Users, Plus } from "lucide-react";
import { EventConfig, EventTeam, User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { TeamMemberManager } from "@/components/admin/team-member-manager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EventTeamWithStats extends EventTeam {
  member_count: number;
  leader?: User;
  sub_leader?: User;
  event_config?: { name: string; is_active: boolean };
}

interface SimpleUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface EventTeamManagerProps {
  eventConfig: EventConfig | null;
}

export function EventTeamManager({ eventConfig }: EventTeamManagerProps) {
  const [teams, setTeams] = useState<EventTeamWithStats[]>([]);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeam, setEditingTeam] = useState<EventTeamWithStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<EventTeamWithStats | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    leader_id: "",
    sub_leader_id: "",
  });
  const supabase = createClient();

  useEffect(() => {
    if (eventConfig) {
      const fetchTeams = async () => {
        try {
          const response = await fetch(`/api/admin/teams?event_config_id=${eventConfig.id}`);
          if (!response.ok) throw new Error('Failed to fetch teams');
          
          const data = await response.json();
          setTeams(data.teams || []);
        } catch (error) {
          console.error('Error fetching teams:', error);
          toast.error('Không thể tải danh sách nhóm');
        } finally {
          setIsLoading(false);
        }
      };

      const fetchUsers = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, role')
            .in('role', ['event_organizer', 'regional_admin', 'super_admin'])
            .order('full_name');

          if (error) throw error;
          setUsers(data || []);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };

      fetchTeams();
      fetchUsers();
    }
  }, [eventConfig, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventConfig) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, string | null> & { id?: string } = {
        ...formData,
        event_config_id: eventConfig.id,
        leader_id: formData.leader_id || null,
        sub_leader_id: formData.sub_leader_id || null,
      };

      const url = '/api/admin/teams';
      const method = editingTeam ? 'PUT' : 'POST';
      
      if (editingTeam) {
        payload.id = editingTeam.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save team');
      }

      const { team } = await response.json();
      
      if (editingTeam) {
        setTeams(prev => prev.map(t => t.id === team.id ? team : t));
        toast.success('Nhóm đã được cập nhật');
      } else {
        setTeams(prev => [...prev, team]);
        toast.success('Nhóm đã được tạo');
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        leader_id: "",
        sub_leader_id: "",
      });
      setEditingTeam(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving team:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu nhóm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (team: EventTeamWithStats) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      leader_id: team.leader_id || "",
      sub_leader_id: team.sub_leader_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (team: EventTeamWithStats) => {
    if (team.member_count > 0) {
      toast.error('Không thể xóa nhóm có thành viên. Vui lòng chuyển thành viên trước khi xóa.');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa nhóm "${team.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/teams?id=${team.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể xóa đội');
      }

      setTeams(prev => prev.filter(t => t.id !== team.id));
      toast.success('Nhóm đã được xóa');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa nhóm');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      description: "",
      leader_id: "",
      sub_leader_id: "",
    });
    setEditingTeam(null);
    setIsDialogOpen(false);
  };

  if (!eventConfig) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Vui lòng chọn một sự kiện để quản lý nhóm</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Quản lý nhóm - {eventConfig.name}
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo nhóm mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTeam ? "Chỉnh sửa nhóm" : "Tạo nhóm mới"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingTeam ? "Cập nhật thông tin nhóm" : "Tạo nhóm mới cho sự kiện"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Tên nhóm *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ví dụ: Ban Truyền thông"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả chi tiết về nhóm này..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="leader_id">Trưởng nhóm</Label>
                    <Select
                      value={formData.leader_id}
                      onValueChange={(value) => setFormData({ ...formData, leader_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trưởng nhóm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Chưa chọn</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sub_leader_id">Phó trưởng nhóm</Label>
                    <Select
                      value={formData.sub_leader_id}
                      onValueChange={(value) => setFormData({ ...formData, sub_leader_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phó trưởng nhóm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Chưa chọn</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting 
                        ? (editingTeam ? "Đang cập nhật..." : "Đang tạo...") 
                        : (editingTeam ? "Cập nhật" : "Tạo nhóm")
                      }
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Hủy
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Đang tải...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {teams.map((team) => (
                <Card key={team.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{team.name}</h3>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {team.member_count} thành viên
                          </Badge>
                        </div>
                        
                        {team.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {team.description}
                          </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Trưởng nhóm:</span>
                            <div className="text-muted-foreground">
                              {team.leader?.full_name || "Chưa phân công"}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium">Phó trưởng nhóm:</span>
                            <div className="text-muted-foreground">
                              {team.sub_leader?.full_name || "Chưa phân công"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTeamForMembers(team)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Thành viên
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(team)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(team)}
                          disabled={team.member_count > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {teams.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có nhóm nào được tạo
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Member Management */}
      {selectedTeamForMembers && (
        <TeamMemberManager 
          team={selectedTeamForMembers}
          onUpdate={() => {
            // Refresh teams list to update member counts
            if (eventConfig) {
              const fetchTeams = async () => {
                try {
                  const response = await fetch(`/api/admin/teams?event_config_id=${eventConfig.id}`);
                  if (response.ok) {
                    const data = await response.json();
                    setTeams(data.teams || []);
                  }
                } catch (error) {
                  console.error('Error refreshing teams:', error);
                }
              };
              fetchTeams();
            }
          }}
        />
      )}
    </div>
  );
}
