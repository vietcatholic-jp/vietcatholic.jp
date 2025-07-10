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
  CheckCircle,
  XCircle
} from "lucide-react";
import { Registration, UserRole, EVENT_PARTICIPATION_ROLES, EventParticipationRole } from "@/lib/types";
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

  const getRoleBadge = (role: EventParticipationRole) => {
    const roleInfo = EVENT_PARTICIPATION_ROLES.find(r => r.value === role);
    if (!roleInfo) return <Badge variant="outline">{role}</Badge>;
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    
    if (role.startsWith('volunteer_')) {
      variant = "secondary";
    } else if (role.startsWith('organizer_')) {
      variant = "default";
    } else if (role === 'speaker' || role === 'performer') {
      variant = "destructive";
    }
    
    return <Badge variant={variant}>{roleInfo.label}</Badge>;
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
              {EVENT_PARTICIPATION_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
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
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium">
                      #{registration.invoice_code}
                    </span>
                    {getStatusBadge(registration.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canModifyRegistration(registration) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(registration)}
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Người đăng ký:</span>
                    <div className="font-medium">
                      {registration.user?.full_name || registration.user?.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {registration.user?.email}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Số người tham gia:</span>
                    <div className="font-medium">{registration.participant_count}</div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Tổng tiền:</span>
                    <div className="font-medium">¥{registration.total_amount.toLocaleString()}</div>
                  </div>
                  
                  <div>
                    <span className="text-muted-foreground">Ngày đăng ký:</span>
                    <div className="font-medium">
                      {new Date(registration.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                </div>

                {/* Display registrants with their roles */}
                {registration.registrants && registration.registrants.length > 0 && (
                  <div className="mt-3">
                    <span className="text-muted-foreground text-sm">Danh sách tham gia:</span>
                    <div className="mt-2 space-y-2">
                      {registration.registrants.map((registrant) => (
                        <div key={registrant.id} className="flex items-center justify-between bg-muted/30 rounded p-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{registrant.full_name}</span>
                            {registrant.saint_name && (
                              <span className="text-xs text-muted-foreground">({registrant.saint_name})</span>
                            )}
                            {registrant.is_primary && (
                              <Badge variant="outline" className="text-xs">Chính</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {registrant.event_role && getRoleBadge(registrant.event_role)}
                            <span className="text-xs text-muted-foreground">
                              {registrant.gender === 'male' ? 'Nam' : registrant.gender === 'female' ? 'Nữ' : 'Khác'} • 
                              {registrant.shirt_size}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {registration.notes && (
                  <div className="mt-3 p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">Ghi chú:</span>
                    <span className="ml-1">{registration.notes}</span>
                  </div>
                )}

                {/* Quick Actions for admins */}
                {(['regional_admin', 'super_admin', 'group_leader', 'event_organizer'].includes(userRole)) && (
                  <div className="mt-3 flex items-center gap-2">
                    {registration.status === 'pending' && (userRole === 'regional_admin' || userRole === 'super_admin') && (
                      <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Xác nhận thanh toán
                      </Button>
                    )}
                    {registration.status !== 'cancelled' && (userRole === 'regional_admin' || userRole === 'super_admin') && (
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        Hủy đăng ký
                      </Button>
                    )}
                    {/* View action for all admin roles */}
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Xem chi tiết
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
