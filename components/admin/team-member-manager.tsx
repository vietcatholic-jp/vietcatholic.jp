"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search,
  Loader2,
  Crown,
  User
} from "lucide-react";
import { toast } from "sonner";
import { EventTeam, EventRole } from "@/lib/types";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role_name?: string;
  is_leader: boolean;
  is_sub_leader: boolean;
}

interface TeamMemberManagerProps {
  team: EventTeam;
  onUpdate?: () => void;
}

export function TeamMemberManager({ team, onUpdate }: TeamMemberManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availableRoles, setAvailableRoles] = useState<EventRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [foundUser, setFoundUser] = useState<User | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/teams/${team.id}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setIsLoading(false);
    }
  }, [team.id]);

  const fetchAvailableRoles = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/roles?eventId=${team.event_config_id}&teamId=${team.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch roles');
      }
      const data = await response.json();
      setAvailableRoles(data.roles || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Không thể tải danh sách vai trò');
    }
  }, [team.id, team.event_config_id]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchTeamMembers();
      await fetchAvailableRoles();
    };
    
    fetchData();
  }, [fetchTeamMembers, fetchAvailableRoles]);

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast.error('Vui lòng nhập email để tìm kiếm');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/search?email=${encodeURIComponent(searchEmail)}`);
      if (!response.ok) {
        throw new Error('User not found');
      }
      const data = await response.json();
      setFoundUser(data.user);
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Không tìm thấy người dùng với email này');
      setFoundUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMemberToTeam = async () => {
    if (!foundUser || !selectedRole) {
      toast.error('Vui lòng chọn người dùng và vai trò');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/teams/${team.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: foundUser.id,
          roleId: selectedRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add member');
      }

      toast.success('Đã thêm thành viên vào nhóm');
      setIsAddDialogOpen(false);
      setSearchEmail("");
      setSelectedRole("");
      setFoundUser(null);
      fetchTeamMembers();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể thêm thành viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMemberFromTeam = async (memberId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/teams/${team.id}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: memberId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      toast.success('Đã xóa thành viên khỏi nhóm');
      fetchTeamMembers();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Không thể xóa thành viên');
    }
  };

  const toggleLeaderRole = async (memberId: string, isLeader: boolean, isSubLeader: boolean) => {
    try {
      const response = await fetch(`/api/admin/teams/${team.id}/members`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: memberId,
          isLeader: !isLeader && !isSubLeader, // Toggle leader only if not currently a leader or sub-leader
          isSubLeader: isLeader ? true : !isSubLeader, // If currently leader, make sub-leader; otherwise toggle sub-leader
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update leader role');
      }

      toast.success('Đã cập nhật vai trò lãnh đạo');
      fetchTeamMembers();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating leader role:', error);
      toast.error('Không thể cập nhật vai trò lãnh đạo');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Thành viên nhóm: {team.name}
            <Badge variant="secondary">{members.length} thành viên</Badge>
          </CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Thêm thành viên
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nhóm chưa có thành viên nào
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {member.is_leader ? (
                      <Crown className="h-5 w-5 text-yellow-500" />
                    ) : member.is_sub_leader ? (
                      <Crown className="h-4 w-4 text-blue-500" />
                    ) : (
                      <User className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  
                  <div>
                    <div className="font-medium">{member.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                      {member.role_name && (
                        <span className="ml-2">• {member.role_name}</span>
                      )}
                    </div>
                    {member.phone && (
                      <div className="text-xs text-muted-foreground">
                        {member.phone}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {member.is_leader && (
                      <Badge variant="default">Trưởng nhóm</Badge>
                    )}
                    {member.is_sub_leader && (
                      <Badge variant="secondary">Phó nhóm</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleLeaderRole(member.id, member.is_leader, member.is_sub_leader)}
                  >
                    {member.is_leader ? 'Hủy trưởng nhóm' : member.is_sub_leader ? 'Hủy phó nhóm' : 'Làm phó nhóm'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMemberFromTeam(member.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Member Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm thành viên vào nhóm</DialogTitle>
              <DialogDescription>
                Tìm kiếm người dùng bằng email và chọn vai trò cho họ trong nhóm
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="search-email">Email người dùng</Label>
                <div className="flex gap-2">
                  <Input
                    id="search-email"
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Nhập email để tìm kiếm"
                    onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                  />
                  <Button 
                    type="button" 
                    onClick={searchUser}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {foundUser && (
                <div className="p-3 border rounded-lg bg-green-50">
                  <div className="font-medium">{foundUser.full_name}</div>
                  <div className="text-sm text-muted-foreground">{foundUser.email}</div>
                </div>
              )}

              <div>
                <Label htmlFor="role-select">Vai trò trong nhóm</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={addMemberToTeam}
                  disabled={!foundUser || !selectedRole || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Thêm thành viên
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
