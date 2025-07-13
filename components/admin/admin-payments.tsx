"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminData } from "@/components/admin/admin-context";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { PaymentStats, CancelRequest } from "@/lib/types";

export function AdminPayments() {
  const { data, isLoading } = useAdminData();
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const response = await fetch('/api/admin/payments');
      if (!response.ok) {
        throw new Error('Failed to fetch payment data');
      }
      const result = await response.json();
      setPaymentStats(result.stats);
      setCancelRequests(result.cancelRequests || []);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleCancelRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/admin/cancel-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} cancel request`);
      }

      toast.success(`Yêu cầu hủy đã được ${action === 'approve' ? 'phê duyệt' : 'từ chối'}`);
      fetchPaymentData(); // Refresh data
    } catch (error) {
      console.error(`Error ${action}ing cancel request:`, error);
      toast.error(`Không thể ${action === 'approve' ? 'phê duyệt' : 'từ chối'} yêu cầu`);
    }
  };

  if (isLoading || !data || isLoadingPayments) {
    return null; // Loading is handled by the layout
  }

  const userRole = data.userProfile?.role || 'participant';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý thanh toán</h2>
          <p className="text-muted-foreground">
            Theo dõi thanh toán và xử lý yêu cầu hoàn tiền
          </p>
        </div>
      </div>

      {/* Payment Statistics */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng thu
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{paymentStats.totalReceived.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Đã xác nhận
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Chờ thanh toán
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats.pendingPayments}</div>
              <p className="text-xs text-muted-foreground">
                Đăng ký
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Yêu cầu hủy
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats.cancelRequests}</div>
              <p className="text-xs text-muted-foreground">
                Chờ xử lý
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Hoàn tiền chờ
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats.refundsPending}</div>
              <p className="text-xs text-muted-foreground">
                Cần xử lý
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu hủy đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          {cancelRequests.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Không có yêu cầu hủy nào cần xử lý.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cancelRequests.map((request) => (
                <div 
                  key={request.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{request.user?.full_name || request.account_holder_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Số tiền: ¥{request.refund_amount.toLocaleString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        request.status === 'pending' ? 'secondary' :
                        request.status === 'approved' ? 'default' : 'destructive'
                      }
                    >
                      {request.status === 'pending' && 'Chờ xử lý'}
                      {request.status === 'approved' && 'Đã phê duyệt'}
                      {request.status === 'rejected' && 'Đã từ chối'}
                    </Badge>
                  </div>

                  <div className="text-sm">
                    <p><strong>Lý do hủy:</strong> {request.reason}</p>
                  </div>

                  <div className="bg-muted p-3 rounded text-sm">
                    <p><strong>Thông tin tài khoản nhận tiền:</strong></p>
                    <p>Ngân hàng: {request.bank_name}</p>
                    <p>Số tài khoản: ****{request.bank_account_number.slice(-4)}</p>
                    <p>Chủ tài khoản: {request.account_holder_name}</p>
                  </div>

                  {request.status === 'pending' && userRole === 'event_organizer' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleCancelRequestAction(request.id, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Phê duyệt
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleCancelRequestAction(request.id, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Yêu cầu lúc: {new Date(request.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Management Info */}
      {userRole !== 'event_organizer' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Thông tin quản lý thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Chỉ Event Organizer mới có thể xử lý các yêu cầu hủy và hoàn tiền. 
              Bạn có thể xem thống kê và danh sách yêu cầu.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
