"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  Users, 
  Shield,
  Loader2,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { useHasPermission } from "@/lib/hooks/use-permissions";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
}

interface UserRole {
  role: Role;
  assigned_at: string;
  assigned_by?: {
    full_name?: string;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string; // Legacy role field
}

interface UserRoleAssignmentProps {
  userId: string;
  userEmail: string;
  userName?: string;
  onClose: () => void;
}

export function UserRoleAssignment({ 
  userId, 
  userEmail, 
  userName, 
  onClose 
}: UserRoleAssignmentProps) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");

  const canAssignRoles = useHasPermission('users.assign_roles');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's current roles
      const userRolesResponse = await fetch(`/api/admin/user-roles?userId=${userId}`);
      if (userRolesResponse.ok) {
        const userRolesData = await userRolesResponse.json();
        setUserRoles(userRolesData.userRoles || []);
      }

      // Fetch all available roles
      const rolesResponse = await fetch('/api/admin/system-roles');
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setAvailableRoles(rolesData.roles || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu vai trò');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleAssignRole = async () => {
    if (!selectedRoleId) return;

    try {
      setAssigning(true);
      
      const response = await fetch('/api/admin/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId: selectedRoleId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign role');
      }

      toast.success('Vai trò đã được gán thành công');
      setSelectedRoleId("");
      await fetchData();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn gỡ bỏ vai trò "${roleName}" khỏi người dùng này?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/user-roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove role');
      }

      toast.success('Vai trò đã được gỡ bỏ thành công');
      await fetchData();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  };

  const getAvailableRolesToAssign = () => {
    const assignedRoleIds = userRoles.map(ur => ur.role.id);
    return availableRoles.filter(role => !assignedRoleIds.includes(role.id));
  };

  if (!canAssignRoles) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Bạn không có quyền quản lý vai trò người dùng
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Quản lý vai trò người dùng
          </CardTitle>
          <CardDescription>
            Người dùng: <strong>{userName || userEmail}</strong> ({userEmail})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Assign New Role */}
          <div className="flex items-end gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="role-select">Gán vai trò mới</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Chọn vai trò để gán" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRolesToAssign().map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{role.name}</div>
                          {role.description && (
                            <div className="text-xs text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAssignRole} 
              disabled={!selectedRoleId || assigning}
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gán...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Gán vai trò
                </>
              )}
            </Button>
          </div>

          {/* Current Roles */}
          <div>
            <Label>Vai trò hiện tại</Label>
            {userRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                Người dùng chưa được gán vai trò nào
              </p>
            ) : (
              <div className="mt-2 space-y-3">
                {userRoles.map((userRole) => (
                  <div
                    key={userRole.role.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{userRole.role.name}</div>
                        {userRole.role.description && (
                          <div className="text-sm text-muted-foreground">
                            {userRole.role.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Gán lúc: {new Date(userRole.assigned_at).toLocaleDateString('vi-VN')}
                          </span>
                          {userRole.assigned_by && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                Bởi: {userRole.assigned_by.full_name || userRole.assigned_by.email}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Permission badges */}
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(userRole.role.permissions)
                          .filter(([_, value]) => value)
                          .slice(0, 2)
                          .map(([key]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {key === '*' ? 'Super Admin' : key.split('.')[0]}
                            </Badge>
                          ))
                        }
                        {Object.entries(userRole.role.permissions).filter(([_, value]) => value).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{Object.entries(userRole.role.permissions).filter(([_, value]) => value).length - 2}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveRole(userRole.role.id, userRole.role.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}

// Search component for finding users
export function UserSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Không thể tìm kiếm người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm người dùng</CardTitle>
          <CardDescription>
            Tìm kiếm người dùng để quản lý vai trò
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={searchUsers} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {users.length > 0 && (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium">{user.full_name || user.email}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    {user.role && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedUser(user)}
                  >
                    Quản lý vai trò
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Role Assignment Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Quản lý vai trò người dùng</DialogTitle>
            </DialogHeader>
            <UserRoleAssignment
              userId={selectedUser.id}
              userEmail={selectedUser.email}
              userName={selectedUser.full_name}
              onClose={() => setSelectedUser(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}