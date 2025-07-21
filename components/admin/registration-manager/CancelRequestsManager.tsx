"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CancelRequest } from "@/lib/types";
import { toast } from "sonner";
import { 
  Search, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  ArrowLeft
} from "lucide-react";

interface CancelRequestsManagerProps {
  cancelRequests: CancelRequest[];
  onDataRefresh: () => void;
}

export function CancelRequestsManager({ cancelRequests, onDataRefresh }: CancelRequestsManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter cancel requests
  const filteredRequests = cancelRequests.filter(request => {
    const matchesSearch = 
      request.registration?.invoice_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
          <Clock className="h-3 w-3 mr-1" />
          Chờ xử lý
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Đã duyệt
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Từ chối
        </Badge>;
      case 'processed':
        return <Badge className="bg-blue-500">
          <DollarSign className="h-3 w-3 mr-1" />
          Đã hoàn tiền
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject' | 'processed', adminNotes?: string) => {
    setProcessingId(requestId);

    try {
      const response = await fetch(`/api/admin/registration-manager/cancel-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Process failed');
      }

      toast.success(action === 'approve' ? "Đã duyệt yêu cầu hủy" : "Đã từ chối yêu cầu hủy");
      onDataRefresh();
      
    } catch (error) {
      console.error('Process error:', error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi xử lý yêu cầu");
    } finally {
      setProcessingId(null);
    }
  };

  // Sort requests with pending first
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Yêu cầu hủy đăng ký
          </CardTitle>
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
              <option value="pending">Chờ xử lý</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="processed">Đã hoàn tiền</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== "all" 
              ? "Không tìm thấy yêu cầu hủy nào phù hợp"
              : "Không có yêu cầu hủy nào"
            }
          </div>
        ) : (
          <div className="space-y-4">
            {sortedRequests.map((request) => (
              <div
                key={request.id}
                className={`border rounded-lg p-4 ${
                  request.status === 'pending' 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-medium">
                        #{request.registration?.invoice_code}
                      </span>
                      {getStatusBadge(request.status)}
                      {request.status === 'pending' && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Cần xử lý
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-muted-foreground">Người yêu cầu:</span>
                        <span className="ml-2 font-medium">{request.user?.full_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{request.user?.email}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Số tiền hoàn:</span>
                        <span className="ml-2 font-medium text-red-600">¥{request.refund_amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ngày yêu cầu:</span>
                        <span className="ml-2">{new Date(request.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="text-sm space-y-2">
                      <div>
                        <span className="text-muted-foreground">Lý do hủy:</span>
                        <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{request.reason}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <span className="text-muted-foreground">Tên chủ TK:</span>
                          <span className="ml-2">{request.account_holder_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Ngân hàng:</span>
                          <span className="ml-2">{request.bank_name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Số TK:</span>
                          <span className="ml-2 font-mono">{request.bank_account_number}</span>
                        </div>
                      </div>

                      {request.admin_notes && (
                        <div>
                          <span className="text-muted-foreground">Ghi chú admin:</span>
                          <p className="mt-1 p-2 bg-blue-50 rounded text-sm">{request.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {/** Actions for pending requests */}
                  {request.status === 'pending' && (
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProcessRequest(request.id, 'approve')}
                        disabled={processingId === request.id}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Duyệt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProcessRequest(request.id, 'reject')}
                        disabled={processingId === request.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  )}
                  {/** Actions for processed requests */}
                  {request.status === 'approved' && (
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProcessRequest(request.id, 'processed')}
                        disabled={processingId === request.id}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Đã chuyển khoản
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
