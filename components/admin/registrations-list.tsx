"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle
} from "lucide-react";
import { Registration, UserRole } from "@/lib/types";
import { useRoles } from "@/lib/hooks/use-roles";
import { EditRegistrationForm } from "@/components/registration/edit-registration-form";
import { toast } from "sonner";

interface RegistrationsListProps {
  registrations: Registration[];
  userRole: UserRole;
}

export function RegistrationsList({ registrations, userRole }: RegistrationsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { roles } = useRoles();

  // Filter registrations based on search, status, and role
  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = 
      registration.invoice_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.registrants?.some(r => r.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || registration.status === statusFilter;
    
    const matchesRole = roleFilter === "all" || 
      registration.registrants?.some(r => r.event_role === roleFilter);
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Đã xác nhận</Badge>;
      case 'confirm_paid':
        return <Badge className="bg-blue-500">Đã xác nhận thanh toán</Badge>;
      case 'report_paid':
        return <Badge className="bg-purple-500">Đã gửi biên lai</Badge>;
      case 'pending':
        return <Badge variant="secondary">Chờ thanh toán</Badge>;
      case 'payment_rejected':
        return <Badge variant="destructive">Thanh toán bị từ chối</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
      case 'checked_in':
        return <Badge className="bg-emerald-500">Đã check-in</Badge>;
      case 'checked_out':
        return <Badge className="bg-gray-500">Đã check-out</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleEdit = (registration: Registration) => {
    // Check if registration can be edited
    const hasTickets = registration.tickets && registration.tickets.length > 0;
    const isConfirmed = registration.status === 'confirmed';
    
    if (hasTickets || isConfirmed) {
      toast.error("Không thể chỉnh sửa đăng ký này - vé đã được xuất hoặc đăng ký đã được xác nhận");
      return;
    }
    
    setEditingRegistration(registration);
  };

  const handleDelete = async (registration: Registration) => {
    // Check if registration can be deleted
    const hasTickets = registration.tickets && registration.tickets.length > 0;
    const isConfirmed = registration.status === 'confirmed';
    
    if (hasTickets || isConfirmed) {
      toast.error("Không thể xóa đăng ký này - vé đã được xuất hoặc đăng ký đã được xác nhận");
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa đăng ký #${registration.invoice_code}?`)) {
      return;
    }

    setDeletingId(registration.id);
    
    try {
      const response = await fetch(`/api/registrations/${registration.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      toast.success("Xóa đăng ký thành công!");
      // Refresh the page or update the list
      window.location.reload();
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa đăng ký");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = () => {
    setEditingRegistration(null);
    // Refresh the page or update the list
    window.location.reload();
  };

  const canModifyRegistration = (registration: Registration) => {
    const hasTickets = registration.tickets && registration.tickets.length > 0;
    const isConfirmed = registration.status === 'confirmed';
    return !hasTickets && !isConfirmed;
  };

  // If editing, show edit form
  if (editingRegistration) {
    return (
      <EditRegistrationForm
        registration={editingRegistration}
        onSave={handleSaveEdit}
        onCancel={() => setEditingRegistration(null)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Danh sách đăng ký</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Tất cả vai trò</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== "all" 
              ? "Không tìm thấy đăng ký nào phù hợp"
              : "Chưa có đăng ký nào"
            }
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Mã đăng ký</th>
                    <th className="text-left p-3">Người đăng ký</th>
                    <th className="text-left p-3">Số người</th>
                    <th className="text-left p-3">Tổng tiền</th>
                    <th className="text-left p-3">Trạng thái</th>
                    <th className="text-left p-3">Ngày tạo</th>
                    <th className="text-left p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-mono text-sm font-medium">
                          #{registration.invoice_code}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-sm">
                            {registration.user?.full_name || 'Chưa cập nhật'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {registration.user?.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{registration.participant_count}</span>
                          <span className="text-xs text-muted-foreground">người</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">¥{registration.total_amount.toLocaleString()}</span>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(registration.status)}
                      </td>
                      <td className="p-3">
                        <span className="text-sm">
                          {new Date(registration.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" title="Xem chi tiết">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canModifyRegistration(registration) && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(registration)}
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {(userRole === 'super_admin') && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDelete(registration)}
                              disabled={deletingId === registration.id}
                              title="Xóa đăng ký"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {filteredRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-sm font-medium">
                      #{registration.invoice_code}
                    </div>
                    {getStatusBadge(registration.status)}
                  </div>

                  {/* Main Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Người đăng ký:</span>
                      <span className="font-medium text-right">
                        {registration.user?.full_name || registration.user?.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Số người:</span>
                      <span className="font-medium">{registration.participant_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tổng tiền:</span>
                      <span className="font-medium">¥{registration.total_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ngày tạo:</span>
                      <span className="font-medium">
                        {new Date(registration.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      Xem
                    </Button>
                    {canModifyRegistration(registration) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(registration)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Sửa
                      </Button>
                    )}
                    {(['regional_admin', 'super_admin', 'group_leader', 'event_organizer'].includes(userRole)) && (
                      <>
                        {registration.status === 'pending' && (userRole === 'regional_admin' || userRole === 'super_admin') && (
                          <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Duyệt
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
