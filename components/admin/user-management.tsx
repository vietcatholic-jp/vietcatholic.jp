"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
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
  'participant': 'Tham dự viên',
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // Input value for controlled input
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [regionFilter, setRegionFilter] = useState<RegionType | "all">("all");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(50);

  // Determine which roles current user can assign
  const getAssignableRoles = (): UserRole[] => {
    switch (currentUserRole) {
      case 'super_admin':
        return ['participant','registration_manager', 'event_organizer', 'group_leader', 'regional_admin', 'super_admin'];
      case 'event_organizer':
        return ['participant', 'regional_admin', 'group_leader','registration_manager'];
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
  }, [currentPage, searchTerm, roleFilter, regionFilter]);

  // Reset to page 1 when filters change (except searchTerm)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [roleFilter, regionFilter]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      // Add search parameter if exists
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Add filter parameters
      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }
      if (regionFilter !== 'all') {
        params.append('region', regionFilter);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1); // Reset to page 1 when searching
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
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

      // Refresh the current page to show updated data
      await fetchUsers();

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
          <span className="text-sm font-normal text-muted-foreground">
            ({totalCount} người dùng)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Search Row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline" size="sm" className="px-4">
              <Search className="h-4 w-4 mr-1" />
              Tìm
            </Button>
            {searchTerm && (
              <Button onClick={handleClearSearch} variant="outline" size="sm" className="px-4">
                Xóa
              </Button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex gap-4 items-center flex-wrap">
            <div className="text-sm font-medium text-gray-700">Lọc theo:</div>

            <div className="flex gap-3 flex-wrap">
              <div className="min-w-[160px]">
                <Select value={roleFilter} onValueChange={(value: UserRole | "all") => setRoleFilter(value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <SelectItem key={role} value={role}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currentUserRole === "super_admin" && (
                <div className="min-w-[160px]">
                  <Select value={regionFilter} onValueChange={(value: RegionType | "all") => setRegionFilter(value)}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Khu vực" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả khu vực</SelectItem>
                      {Object.entries(regionLabels).map(([region, label]) => (
                        <SelectItem key={region} value={region}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clear Filters Button */}
              {(roleFilter !== 'all' || regionFilter !== 'all') && (
                <Button
                  onClick={() => {
                    setRoleFilter('all');
                    setRegionFilter('all');
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
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
              {users.map((user) => (
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

          {users.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy người dùng nào
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
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
