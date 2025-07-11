"use client";

import { useState, useEffect } from "react";
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
  Edit2, 
  Search,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { User, UserRole, RegionType } from "@/lib/types";

interface UserManagementProps {
  currentUserRole: UserRole;
  currentUserRegion?: RegionType;
}

const roleLabels: Record<UserRole, string> = {
  'participant': 'Người tham gia',
  'registration_manager': 'Quản lý đăng ký',
  'event_organizer': 'Tổ chức sự kiện', 
  'group_leader': 'Trưởng nhóm',
  'regional_admin': 'Quản trị viên khu vực',
  'super_admin': 'Quản trị viên'
};

const regionLabels: Record<RegionType, string> = {
  'kanto': 'Kanto',
  'kansai': 'Kansai',
  'chubu': 'Chubu',
  'kyushu': 'Kyushu',
  'chugoku': 'Chugoku',
  'shikoku': 'Shikoku',
  'tohoku': 'Tohoku',
  'hokkaido': 'Hokkaido'
};

export function UserManagement({ currentUserRole, currentUserRegion }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [regionFilter, setRegionFilter] = useState<RegionType | "all">("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Determine which roles current user can assign
  const getAssignableRoles = (): UserRole[] => {
    switch (currentUserRole) {
      case 'super_admin':
        return ['participant', 'event_organizer', 'group_leader', 'regional_admin', 'super_admin'];
      case 'regional_admin':
        return ['participant', 'event_organizer', 'group_leader'];
      default:
        return [];
    }
  };

  // Determine which regions current user can manage
  const getManageableRegions = (): RegionType[] => {
    if (currentUserRole === 'super_admin') {
      return ['kanto', 'kansai', 'chubu', 'kyushu', 'chugoku', 'shikoku', 'tohoku', 'hokkaido'];
    } else if (currentUserRole === 'regional_admin' && currentUserRegion) {
      return [currentUserRegion];
    }
    return [];
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, regionFilter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Region filter
    if (regionFilter !== "all") {
      filtered = filtered.filter(user => user.region === regionFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser.id,
          role: editingUser.role,
          region: editingUser.region,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id ? editingUser : user
      ));

      toast.success('Cập nhật thông tin người dùng thành công');
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Không thể cập nhật thông tin người dùng');
    } finally {
      setIsSaving(false);
    }
  };

  const canManageUser = (user: User): boolean => {
    // Super admin can manage everyone except other super admins (unless they are the same person)
    if (currentUserRole === 'super_admin') {
      return true;
    }
    
    // Regional admin can only manage users in their region with lower roles
    if (currentUserRole === 'regional_admin') {
      return user.region === currentUserRegion && 
             !['regional_admin', 'super_admin'].includes(user.role);
    }

    return false;
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
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Quản lý người dùng
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={(value: UserRole | "all") => setRoleFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {Object.entries(roleLabels).map(([role, label]) => (
                <SelectItem key={role} value={role}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={(value: RegionType | "all") => setRegionFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Lọc theo khu vực" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khu vực</SelectItem>
              {Object.entries(regionLabels).map(([region, label]) => (
                <SelectItem key={region} value={region}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Tên</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Vai trò</th>
                <th className="text-left p-3">Khu vực</th>
                <th className="text-left p-3">Ngày tạo</th>
                <th className="text-left p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{user.full_name || 'Chưa cập nhật'}</div>
                    </div>
                  </td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    <Badge variant={user.role === 'super_admin' ? 'destructive' : 
                                   user.role === 'regional_admin' ? 'default' : 'secondary'}>
                      {roleLabels[user.role]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {user.region ? regionLabels[user.region] : 'Chưa cập nhật'}
                  </td>
                  <td className="p-3">
                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-3">
                    {canManageUser(user) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Chỉnh sửa
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy người dùng nào
            </div>
          )}
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
              <DialogDescription>
                Cập nhật vai trò và khu vực cho người dùng
              </DialogDescription>
            </DialogHeader>
            
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <Label>Tên người dùng</Label>
                  <Input value={editingUser.full_name || ''} disabled />
                </div>
                
                <div>
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled />
                </div>

                <div>
                  <Label>Vai trò</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: UserRole) => 
                      setEditingUser(prev => prev ? {...prev, role: value} : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAssignableRoles().map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Khu vực</Label>
                  <Select 
                    value={editingUser.region || ''} 
                    onValueChange={(value: RegionType) => 
                      setEditingUser(prev => prev ? {...prev, region: value} : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khu vực" />
                    </SelectTrigger>
                    <SelectContent>
                      {getManageableRegions().map((region) => (
                        <SelectItem key={region} value={region}>
                          {regionLabels[region]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSaveUser}
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
