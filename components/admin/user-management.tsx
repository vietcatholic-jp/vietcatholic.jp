"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  Mail,
  MessageCircle,
  Shield,
  Zap,
  Code
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

const providerLabels: Record<string, string> = {
  'email': 'Email',
  'google': 'Google',
  'facebook': 'Facebook',
  'github': 'GitHub',
  'twitter': 'Twitter',
  'discord': 'Discord'
};

const getAuthProviders = (user: User): string[] => {
  if (user.auth_identities && user.auth_identities.length > 0) {
    return user.auth_identities.map(identity => identity.provider);
  }
  // Fallback to email if no identities found
  return ['email'];
};

// Custom Google icon component
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Custom Facebook icon component
const FacebookIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const getProviderIcon = (provider: string) => {
  const label = providerLabels[provider] || provider;

  switch (provider) {
    case 'email':
      return (
        <div title={label} className="inline-flex">
          <Mail className="h-4 w-4 text-gray-600" />
        </div>
      );
    case 'google':
      return (
        <div title={label} className="inline-flex">
          <GoogleIcon />
        </div>
      );
    case 'facebook':
      return (
        <div title={label} className="inline-flex">
          <FacebookIcon />
        </div>
      );
    case 'github':
      return (
        <div title={label} className="inline-flex">
          <Code className="h-4 w-4 text-gray-800" />
        </div>
      );
    case 'twitter':
      return (
        <div title={label} className="inline-flex">
          <Zap className="h-4 w-4 text-blue-400" />
        </div>
      );
    case 'discord':
      return (
        <div title={label} className="inline-flex">
          <MessageCircle className="h-4 w-4 text-indigo-600" />
        </div>
      );
    default:
      return (
        <div title={label} className="inline-flex">
          <Shield className="h-4 w-4 text-gray-500" />
        </div>
      );
  }
};

const ProviderIcons = ({ providers }: { providers: string[] }) => {
  if (!providers || providers.length === 0) {
    return <span className="text-xs text-gray-500">Email</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {providers.map((provider, index) => (
        <div key={`${provider}-${index}`} className="inline-flex">
          {getProviderIcon(provider)}
        </div>
      ))}
      {providers.length > 3 && (
        <span className="text-xs text-gray-500 ml-1">+{providers.length - 3}</span>
      )}
    </div>
  );
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

  const fetchUsers = useCallback(async () => {
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

      // Request auth provider information for admin user management
      params.append('includeAuthProviders', 'true');

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
  }, [currentPage, searchTerm, roleFilter, regionFilter, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change (except searchTerm)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [roleFilter, regionFilter, currentPage]);

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
                <th className="text-left p-3 hidden sm:table-cell">Email</th>
                <th className="text-left p-3">Vai trò</th>
                <th className="text-left p-3 hidden md:table-cell">Khu vực</th>
                <th className="text-left p-3 hidden lg:table-cell">Provider</th>
                <th className="text-left p-3 hidden md:table-cell">Ngày tạo</th>
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
                  <td className="p-3 hidden sm:table-cell">{user.email}</td>
                  <td className="p-3">
                    <Badge variant={user.role === 'super_admin' ? 'destructive' :
                                   user.role === 'regional_admin' ? 'default' : 'secondary'}>
                      {roleLabels[user.role]}
                    </Badge>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    {user.region ? regionLabels[user.region] : 'Chưa cập nhật'}
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <ProviderIcons providers={getAuthProviders(user)} />
                  </td>
                  <td className="p-3 hidden md:table-cell">
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
