"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Eye, 
  Edit, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Registration } from "@/lib/types";
import { RegistrationDetailModal } from "./RegistrationDetailModal";
import { RegistrationEditModal } from "./RegistrationEditModal";
import { Button } from "@/components/ui/button";

interface RegistrationManagerListProps {
  registrations: Registration[];
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  statusFilter: string;
  isLoading: boolean;
  onDataRefresh: () => void;
  onSearch: (search: string) => void;
  onStatusFilter: (status: string) => void;
  onPageChange: (page: number) => void;
}

export function RegistrationManagerList({ 
  registrations, 
  currentPage,
  totalPages,
  searchTerm,
  statusFilter,
  isLoading,
  onDataRefresh,
  onSearch,
  onStatusFilter,
  onPageChange
}: RegistrationManagerListProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [viewingRegistration, setViewingRegistration] = useState<Registration | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearchTerm, onSearch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Chờ thanh toán</Badge>;
      case 'report_paid':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Đã báo thanh toán</Badge>;
      case 'confirm_paid':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Đã xác nhận thanh toán</Badge>;
      case 'payment_rejected':
        return <Badge variant="destructive">Thanh toán bị từ chối</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500">Đã xác nhận</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>;
      case 'cancel_pending':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Chờ hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const priorityStatuses = ['report_paid', 'cancel_pending', 'payment_rejected'];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle>Danh sách đăng ký</CardTitle>
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã đăng ký..."
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-input bg-background rounded-md text-sm flex-1 md:flex-none"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="report_paid">Đã báo thanh toán</option>
                  <option value="confirm_paid">Đã xác nhận thanh toán</option>
                  <option value="payment_rejected">Thanh toán bị từ chối</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="cancel_pending">Chờ hủy</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {localSearchTerm || statusFilter !== "all" 
                ? "Không tìm thấy đăng ký nào phù hợp"
                : "Chưa có đăng ký nào"
              }
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Mã đăng ký</th>
                        <th className="text-left p-3">Người đăng ký</th>
                        <th className="text-left p-3">Trạng thái</th>
                        <th className="text-left p-3">Số người</th>
                        <th className="text-left p-3">Tổng tiền</th>
                        <th className="text-left p-3">Ngày đăng ký</th>
                        <th className="text-left p-3">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((registration) => (
                        <tr
                          key={registration.id}
                          className={`border-b hover:bg-gray-50 ${
                            priorityStatuses.includes(registration.status) 
                              ? 'bg-orange-50' 
                              : ''
                          }`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium">
                                #{registration.invoice_code}
                              </span>
                              {priorityStatuses.includes(registration.status) && (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                  Ưu tiên
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{registration.user?.full_name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{registration.user?.email}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(registration.status)}
                          </td>
                          <td className="p-3 font-medium">
                            {registration.participant_count}
                          </td>
                          <td className="p-3 font-medium">
                            ¥{registration.total_amount.toLocaleString()}
                          </td>
                          <td className="p-3 text-sm">
                            {new Date(registration.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingRegistration(registration)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingRegistration(registration)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile List */}
              <div className="md:hidden space-y-3">
                {registrations.map((registration) => (
                  <div
                    key={registration.id}
                    className={`border rounded-lg p-3 ${
                      priorityStatuses.includes(registration.status) 
                        ? 'border-orange-200 bg-orange-50' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          #{registration.invoice_code}
                        </span>
                        {priorityStatuses.includes(registration.status) && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                            Ưu tiên
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingRegistration(registration)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRegistration(registration)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Người đăng ký:</span>
                        <span className="font-medium">{registration.user?.full_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trạng thái:</span>
                        {getStatusBadge(registration.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Số người:</span>
                        <span className="font-medium">{registration.participant_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tổng tiền:</span>
                        <span className="font-medium">¥{registration.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Trang {currentPage} của {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => onPageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      {viewingRegistration && (
        <RegistrationDetailModal
          registration={viewingRegistration}
          onClose={() => setViewingRegistration(null)}
        />
      )}

      {/* Edit Modal */}
      {editingRegistration && (
        <RegistrationEditModal
          registration={editingRegistration}
          onClose={() => setEditingRegistration(null)}
          onSave={() => {
            setEditingRegistration(null);
            onDataRefresh();
          }}
        />
      )}
    </>
  );
}
