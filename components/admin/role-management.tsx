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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Shield,
  Loader2 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, boolean>;
  user_count: number;
  created_at: string;
}

const RoleFormSchema = z.object({
  name: z.string().min(1, "Tên vai trò là bắt buộc"),
  description: z.string().optional(),
  permissions: z.record(z.boolean()).default({}),
});

type RoleFormData = z.infer<typeof RoleFormSchema>;

// Define available permissions
const AVAILABLE_PERMISSIONS = {
  'admin.dashboard.view': 'Xem bảng điều khiển quản trị',
  'registrations.view_all': 'Xem tất cả đăng ký',
  'registrations.edit': 'Chỉnh sửa đăng ký',
  'registrants.manage': 'Quản lý người tham gia',
  'payments.view': 'Xem thanh toán',
  'payments.confirm': 'Xác nhận thanh toán',
  'refunds.manage': 'Quản lý hoàn tiền',
  'teams.view_own_roster': 'Xem danh sách đội của mình',
  'teams.assign_members': 'Phân công thành viên đội',
  'teams.manage': 'Quản lý đội',
  'teams.*': 'Tất cả quyền đội',
  'events.edit': 'Chỉnh sửa sự kiện',
  'events.*': 'Tất cả quyền sự kiện',
  'users.assign_roles': 'Gán vai trò cho người dùng',
  'roles.view': 'Xem vai trò',
  'roles.create': 'Tạo vai trò',
  'roles.edit': 'Chỉnh sửa vai trò',
  'roles.delete': 'Xóa vai trò',
  'roles.*': 'Tất cả quyền vai trò',
  'analytics.view': 'Xem phân tích',
  '*': 'Tất cả quyền hạn (Super Admin)',
};

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(RoleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: {},
    },
  });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system-roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      
      const data = await response.json();
      setRoles(data.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Không thể tải danh sách vai trò');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = () => {
    setEditingRole(null);
    form.reset({
      name: "",
      description: "",
      permissions: {},
    });
    setIsDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    form.reset({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: RoleFormData) => {
    try {
      setIsSubmitting(true);
      
      const url = editingRole 
        ? '/api/admin/system-roles' 
        : '/api/admin/system-roles';
      
      const method = editingRole ? 'PUT' : 'POST';
      const payload = editingRole 
        ? { id: editingRole.id, ...data }
        : data;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save role');
      }

      toast.success(
        editingRole 
          ? 'Vai trò đã được cập nhật thành công' 
          : 'Vai trò mới đã được tạo thành công'
      );
      
      setIsDialogOpen(false);
      await fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.user_count > 0) {
      toast.error('Không thể xóa vai trò đã được gán cho người dùng');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/system-roles?id=${role.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete role');
      }

      toast.success('Vai trò đã được xóa thành công');
      await fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    const currentPermissions = form.getValues('permissions');
    form.setValue('permissions', {
      ...currentPermissions,
      [permissionKey]: checked,
    });
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Vai trò hệ thống</h3>
          <p className="text-sm text-muted-foreground">
            Quản lý các vai trò và quyền hạn trong hệ thống
          </p>
        </div>
        <Button onClick={handleCreateRole}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo vai trò mới
        </Button>
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{role.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {role.description || "Không có mô tả"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{role.user_count} người dùng</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(role.permissions)
                      .filter(([_, value]) => value)
                      .slice(0, 3)
                      .map(([key]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key === '*' ? 'Super Admin' : key}
                        </Badge>
                      ))
                    }
                    {Object.entries(role.permissions).filter(([_, value]) => value).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{Object.entries(role.permissions).filter(([_, value]) => value).length - 3} khác
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRole(role)}
                    disabled={role.user_count > 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Xóa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Cập nhật thông tin và quyền hạn cho vai trò này'
                : 'Tạo vai trò mới với các quyền hạn tùy chỉnh'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên vai trò</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Nhập tên vai trò"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Mô tả vai trò (tùy chọn)"
                />
              </div>
            </div>

            <div>
              <Label>Quyền hạn</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Chọn các quyền hạn mà vai trò này được phép thực hiện
              </p>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(AVAILABLE_PERMISSIONS).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={form.watch('permissions')[key] || false}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(key, checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {key}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  editingRole ? 'Cập nhật' : 'Tạo vai trò'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}