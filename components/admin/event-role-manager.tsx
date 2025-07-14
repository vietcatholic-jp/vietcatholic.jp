"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {  Edit2, Trash2 } from "lucide-react";
import { EventRole, EventConfig } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface EventRoleManagerProps {
  eventConfig: EventConfig | null;
}

export function EventRoleManager({ eventConfig }: EventRoleManagerProps) {
  const [roles, setRoles] = useState<EventRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<EventRole | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const supabase = createClient();

  useEffect(() => {
    if (eventConfig) {
      fetchRoles();
    }
  }, [eventConfig]);

  const fetchRoles = async () => {
    if (!eventConfig) return;
    
    try {
      const { data, error } = await supabase
        .from('event_roles')
        .select('*')
        .eq('event_config_id', eventConfig.id)
        .order('name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Không thể tải danh sách vai trò');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventConfig) return;

    setIsSubmitting(true);
    try {
      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from('event_roles')
          .update({
            name: formData.name,
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        toast.success('Vai trò đã được cập nhật');
      } else {
        // Create new role
        const { error } = await supabase
          .from('event_roles')
          .insert({
            event_config_id: eventConfig.id,
            name: formData.name,
            description: formData.description,
          });

        if (error) throw error;
        toast.success('Vai trò đã được tạo');
      }

      // Reset form
      setFormData({ name: "", description: "" });
      setEditingRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Có lỗi xảy ra khi lưu vai trò');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (role: EventRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
    });
  };

  const handleDelete = async (role: EventRole) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('event_roles')
        .delete()
        .eq('id', role.id);

      if (error) throw error;
      toast.success('Vai trò đã được xóa');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Có lỗi xảy ra khi xóa vai trò');
    }
  };

  const handleCancel = () => {
    setEditingRole(null);
    setFormData({ name: "", description: "" });
  };

  if (!eventConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quản lý vai trò sự kiện</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Vui lòng chọn một sự kiện để quản lý vai trò.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingRole ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên vai trò</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Trưởng ban Truyền thông"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết về vai trò này..."
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (editingRole ? "Đang cập nhật..." : "Đang tạo...") 
                  : (editingRole ? "Cập nhật" : "Tạo vai trò")
                }
              </Button>
              {editingRole && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Hủy
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách vai trò</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Đang tải...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Chưa có vai trò nào được tạo.</p>
              <p className="text-sm">Hãy tạo vai trò đầu tiên bằng form ở trên.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{role.name}</h3>
                    {role.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(role)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(role)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
