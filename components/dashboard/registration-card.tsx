"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RegistrationActions } from "@/components/dashboard/registration-actions";
import { 
  Users, 
  CreditCard,
  QrCode,
  ChevronDown,
  ChevronUp,
  Eye,
  Receipt,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { EVENT_PARTICIPATION_ROLES, Registrant } from "@/lib/types";

interface RegistrationCardProps {
  registration: {
    id: string;
    invoice_code: string;
    status: string;
    created_at: string;
    participant_count: number;
    total_amount: number;
    receipts: { count: number }[] | { count: number };
    registrants: Registrant[];
    notes?: string;
  };
  eventConfig?: {
    cancellation_deadline?: string;
  } | null;
  isLast: boolean;
}

export function RegistrationCard({ registration, eventConfig, isLast }: RegistrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 border-green-200 text-green-800';
      case 'confirm_paid': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'report_paid': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'pending': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'payment_rejected': return 'bg-red-50 border-red-200 text-red-800';
      case 'cancelled': return 'bg-red-50 border-red-200 text-red-800';
      case 'checked_in': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'checked_out': return 'bg-gray-50 border-gray-200 text-gray-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'confirm_paid': return <CheckCircle className="h-4 w-4" />;
      case 'report_paid': return <Clock className="h-4 w-4 animate-pulse" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'payment_rejected': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'checked_in': return <CheckCircle className="h-4 w-4" />;
      case 'checked_out': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thanh toán';
      case 'report_paid': return 'Chờ xác nhận từ admin';
      case 'confirm_paid': return 'Đã xác nhận thanh toán';
      case 'payment_rejected': return 'Thanh toán bị từ chối';
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
      case 'checked_in': return 'Đã check-in';
      case 'checked_out': return 'Đã check-out';
      default: return status;
    }
  };

  return (
    <div className={`transition-all duration-200 ${!isLast ? 'border-b' : ''}`}>
      <div className="p-4 hover:bg-muted/30 transition-colors">
        {/* Header - Always visible */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getStatusColor(registration.status)}`}>
              {getStatusIcon(registration.status)}
              <span className="hidden sm:inline">{getStatusText(registration.status)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-sm font-medium text-muted-foreground">
                #{registration.invoice_code}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(registration.created_at).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Quick Info - Always visible on mobile */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{registration.participant_count} người</span>
          </div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">¥{registration.total_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons - Always visible */}
        <div className="flex flex-wrap gap-2 mb-3">
          <RegistrationActions 
            registrationId={registration.id}
            invoiceCode={registration.invoice_code}
            status={registration.status}
            registrantIds={registration.registrants?.map((r: Registrant) => r.id) || []}
            eventConfig={eventConfig}
          />
          
          {(registration.status === 'pending' || registration.status === 'payment_rejected') && (
            <Link href={`/payment/${registration.invoice_code}`}>
              <Button size="sm" variant="outline" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                Thanh toán
              </Button>
            </Link>
          )}
          
          {(registration.status === 'confirmed' || registration.status === 'checked_in' || registration.status === 'checked_out') && (
            <Link href={`/tickets/${registration.invoice_code}`}>
              <Button size="sm" variant="outline" className="text-xs">
                <QrCode className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">Xem vé</span>
                <span className="xs:hidden">Vé</span>
              </Button>
            </Link>
          )}

          {(registration.status === 'confirmed' || registration.status === 'checked_in' || registration.status === 'checked_out') && (
            <Link href={`/register/${registration.id}`}>
              <Button size="sm" variant="outline" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Chi tiết
              </Button>
            </Link>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            {/* Detailed Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Hóa đơn:</span>
                <span className="font-medium">
                  {(() => {
                    const receipts = registration.receipts;
                    const receiptCount = Array.isArray(receipts) 
                      ? (receipts.length > 0 ? receipts[0].count : 0)
                      : receipts.count;
                    
                    return receiptCount > 0 ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Đã nộp
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Chưa nộp
                      </span>
                    );
                  })()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Vé:</span>
                <span className="font-medium">
                  {(registration.status === 'confirmed' || registration.status === 'checked_in' || registration.status === 'checked_out') ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Có sẵn
                    </span>
                  ) : (
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Chưa có
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Status-specific messages */}
            {registration.status === 'report_paid' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <Clock className="h-4 w-4 animate-pulse" />
                  <div className="text-sm font-medium">Chờ xác nhận thanh toán</div>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Biên lai thanh toán của bạn đã được gửi và đang chờ admin xác nhận. Bạn sẽ nhận được thông báo khi thanh toán được xác nhận.
                </div>
              </div>
            )}

            {registration.status === 'payment_rejected' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-4 w-4" />
                  <div className="text-sm font-medium">Thanh toán bị từ chối</div>
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Biên lai thanh toán của bạn không được chấp nhận. Vui lòng kiểm tra lại thông tin và gửi lại biên lai mới.
                </div>
              </div>
            )}

            {registration.status === 'confirm_paid' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <div className="text-sm font-medium">Thanh toán đã được xác nhận</div>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Thanh toán của bạn đã được admin xác nhận. Đăng ký đang chờ xử lý cuối cùng để cấp vé.
                </div>
              </div>
            )}

            {/* Registrants List */}
            {registration.registrants && registration.registrants.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Danh sách tham gia ({registration.registrants.length} người)
                </div>
                <div className="grid gap-2">
                  {registration.registrants.map((registrant, idx) => {
                    const roleInfo = EVENT_PARTICIPATION_ROLES.find(r => r.value === registrant.event_role);
                    const isPrimary = registrant.is_primary;
                    
                    return (
                      <div 
                        key={registrant.id} 
                        className={`relative rounded-lg border p-3 transition-colors hover:bg-muted/30 ${
                          isPrimary ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
                        }`}
                      >
                        {isPrimary && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                            Chính
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          {/* Avatar with index */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isPrimary 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </div>
                          
                          {/* Main content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              {/* Name section */}
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {registrant.full_name}
                                </div>
                                {registrant.saint_name && (
                                  <div className="text-xs text-muted-foreground">
                                    Tên thánh: {registrant.saint_name}
                                  </div>
                                )}
                              </div>
                              
                              {/* Role badge */}
                              <div className="flex-shrink-0">
                                {roleInfo && (
                                  <Badge 
                                    variant={
                                      registrant.event_role?.startsWith('volunteer_') ? 'secondary' :
                                      registrant.event_role?.startsWith('organizer_') ? 'default' :
                                      registrant.event_role === 'speaker' || registrant.event_role === 'performer' ? 'destructive' :
                                      'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {roleInfo.label}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {/* Additional info */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                                Size: {registrant.shirt_size}
                              </span>
                              {registrant.age_group && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                                  {registrant.age_group.replace('_', '-')}
                                </span>
                              )}
                              {registrant.gender && (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                                  {registrant.gender === 'male' ? 'Nam' : registrant.gender === 'female' ? 'Nữ' : 'Khác'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {registration.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-1">Ghi chú:</div>
                <div className="text-sm">{registration.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
