"use client";

import { useState } from "react";
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
  XCircle,
  Camera,
  Edit3
} from "lucide-react";
import Link from "next/link";
import { Registrant, SHIRT_SIZES } from "@/lib/types";
import { RoleBadgeCompact } from "@/components/ui/role-badge";
import { AvatarManager } from "@/components/avatar/avatar-manager";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

export function RegistrationCard({ registration, eventConfig }: RegistrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 border-green-200 text-green-800';
      case 'temp_confirmed': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'donation': return 'bg-green-50 border-green-200 text-green-800';
      case 'confirm_paid': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'report_paid': return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'pending': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'payment_rejected': return 'bg-red-50 border-red-200 text-red-800';
      case 'cancelled': return 'bg-red-50 border-red-200 text-red-800';
      case 'cancel_pending': return 'bg-red-50 border-red-200 text-red-800';
      case 'cancel_accepted': return 'bg-red-50 border-red-200 text-red-800';
      case 'checked_in': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'checked_out': return 'bg-gray-50 border-gray-200 text-gray-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'temp_confirmed': return <Clock className="h-4 w-4 animate-pulse" />;
      case 'confirm_paid': return <CheckCircle className="h-4 w-4" />;
      case 'report_paid': return <Clock className="h-4 w-4 animate-pulse" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'payment_rejected': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'cancel_pending': return <Clock className="h-4 w-4" />;
      case 'cancel_accepted': return <CheckCircle className="h-4 w-4" />;
      case 'donation': return <CreditCard className="h-4 w-4" />;
      case 'checked_in': return <CheckCircle className="h-4 w-4" />;
      case 'checked_out': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ đóng phí tham dự';
      case 'report_paid': return 'Chờ xác nhận';
      case 'confirm_paid': return 'Đã xác nhận đóng phí tham dự';
      case 'payment_rejected': return 'Đóng phí tham dự bị từ chối';
      case 'donation': return 'Huỷ và quyên góp';
      case 'cancelled': return 'Đã hủy';
      case 'cancel_pending': return 'Yêu cầu hủy đang chờ xử lý';
      case 'cancel_accepted': return 'Yêu cầu hủy đã được chấp nhận';
      case 'cancel_rejected': return 'Yêu cầu hủy đã bị từ chối';
      case 'confirmed': return 'Đã xác nhận';
      case 'temp_confirmed': return 'Tạm xác nhận (thanh toán sau)';
      case 'checked_in': return 'Đã check-in';
      case 'checked_out': return 'Đã check-out';
      default: return status;
    }
  };

  return (
    <div className={`bg-gradient-to-br mt-4 from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-lg border`}>
      <div className="p-6 hover:bg-white/50 dark:hover:bg-black/20 transition-colors rounded-lg">
        {/* Header - Always visible */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-xl font-bold">
                {registration.invoice_code}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(registration.created_at).toLocaleDateString('vi-VN')}
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium shadow-sm ${getStatusColor(registration.status)}`}>
              {getStatusIcon(registration.status)}
              <span className="inline">{getStatusText(registration.status)}</span>
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
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2 p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-700 dark:text-gray-200">{registration.participant_count} người</span>
              {/* Avatar completion indicator */}
              {registration.registrants && (
                <div className="flex items-center gap-1 mt-1">
                  {(() => {
                    const withAvatars = registration.registrants.filter(r => r.portrait_url).length;
                    const total = registration.registrants.length;
                    const isComplete = withAvatars === total;

                    return (
                      <div className={`flex items-center gap-1 text-xs ${
                        isComplete ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        <Camera className="h-3 w-3" />
                        <span>{withAvatars}/{total} ảnh</span>
                        {!isComplete && (
                          <span className="text-xs text-amber-600 font-medium">
                            • Cần thêm ảnh
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-full">
              <Receipt className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-200">¥{registration.total_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Action Buttons - Always visible */}
        <div className="flex flex-wrap gap-3 mb-4">
          <RegistrationActions 
            registrationId={registration.id}
            invoiceCode={registration.invoice_code}
            status={registration.status}
            registrantIds={registration.registrants?.map((r: Registrant) => r.id) || []}
            totalAmount={registration.total_amount}
            participantCount={registration.participant_count}
            eventConfig={eventConfig}
          />
          
          {(registration.status === 'pending' || registration.status === 'payment_rejected') && (
            <Link href={`/payment/${registration.invoice_code}`}>
              <Button size="sm" variant="outline" className="text-xs bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-orange-100 hover:border-amber-300 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800 dark:text-amber-300">
                <CreditCard className="h-3 w-3 mr-1" />
                Đóng phí tham dự
              </Button>
            </Link>
          )}

          {(registration.status === 'confirmed' || registration.status === 'temp_confirmed' || registration.status === 'checked_in' || registration.status === 'checked_out') && (
            <Link href={`/tickets/${registration.invoice_code}`}>
              <Button size="sm" variant="outline" className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700 hover:from-green-100 hover:to-emerald-100 hover:border-green-300 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800 dark:text-green-300">
                <QrCode className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">Xem vé</span>
                <span className="xs:hidden">Vé</span>
              </Button>
            </Link>
          )}

          {(registration.status === 'confirmed' || registration.status === 'temp_confirmed' || registration.status === 'checked_in' || registration.status === 'checked_out') && (
            <Link href={`/register/${registration.id}`}>
              <Button size="sm" variant="outline" className="text-xs bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 dark:from-blue-950/30 dark:to-purple-950/30 dark:border-blue-800 dark:text-blue-300">
                <Eye className="h-3 w-3 mr-1" />
                Chi tiết
              </Button>
            </Link>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-6 border-t border-blue-200/50 dark:border-blue-700/50 pt-6">
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
                  {(registration.status === 'confirmed' || registration.status === 'temp_confirmed' || registration.status === 'checked_in' || registration.status === 'checked_out') ? (
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
            {registration.status === 'pending' && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 rounded-lg shadow-sm">
                <ul className="text-sm">
                  <li>Hạn chuyển khoản là 10 ngày kể từ ngày đăng ký và trước ngày 10/09/2025</li>
                  <li>Vui lòng chuyển khoản trước ngày <strong className="text-xl">{new Date(new Date(registration.created_at).getTime() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}</strong> </li>
                </ul>
              </div>
            )}

            {/* Status-specific messages */}
            {registration.status === 'report_paid' && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 text-blue-800 dark:text-blue-300">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full">
                    <Clock className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="text-sm font-medium">Chờ xác nhận đóng phí tham dự</div>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-3 ml-11">
                  Đóng phí tham dự của bạn đang chờ xác nhận. <strong>Sau khi được xác nhận, bạn sẽ có thể tạo vé tham dự.</strong>
                  <br />Vui lòng đợi trong thời gian ngắn. Nếu quá lâu, bạn có thể liên hệ với admin để được hỗ trợ.
                </div>
              </div>
            )}

            {registration.status === 'payment_rejected' && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border border-red-200 dark:border-red-700 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 text-red-800 dark:text-red-300">
                  <div className="p-2 bg-red-100 dark:bg-red-800/50 rounded-full">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium">Đóng phí tham dự bị từ chối</div>
                </div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-3 ml-11">
                  Biên lai đóng phí tham dự của bạn không được chấp nhận. Vui lòng kiểm tra lại thông tin và gửi lại biên lai mới.
                </div>
              </div>
            )}

            {registration.status === 'confirm_paid' && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border border-green-200 dark:border-green-700 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 text-green-800 dark:text-green-300">
                  <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium">Đóng phí tham dự đã được xác nhận</div>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-3 ml-11">
                  Đóng phí tham dự của bạn đã được admin xác nhận. Đăng ký đang chờ xử lý cuối cùng để cấp vé.
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

                {/* Avatar upload hint for users without photos */}
                {registration.registrants.some(r => !r.portrait_url) && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800/50 rounded-full shrink-0">
                        <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                          💡 Thêm ảnh đại diện cho vé tham dự
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                          Nhấp vào vòng tròn ảnh đại diện bên dưới để tải lên ảnh của bạn.
                          Ảnh sẽ được hiển thị trên vé tham dự và giúp ban tổ chức dễ dàng nhận diện.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid gap-2">
                  {registration.registrants.map((registrant, idx) => {
                    const isPrimary = registrant.is_primary;
                    
                    return (
                      <div 
                        key={registrant.id} 
                        className={`relative rounded-lg border p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                          isPrimary 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-700' 
                            : 'bg-white/60 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {isPrimary && (
                          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-orange-500 text-gray-900 text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                            Chính
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          {/* Enhanced Avatar with editing capability */}
                          <div className="relative group">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="relative">
                                    <AvatarManager
                                      registrantId={registrant.id}
                                      registrantName={registrant.full_name}
                                      currentAvatarUrl={registrant.portrait_url}
                                      size="md"
                                      editable={true}
                                      className="w-12 h-12 border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    />
                                    {/* Edit indicator overlay */}
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                      <Edit3 className="h-3 w-3 text-white" />
                                    </div>
                                    {/* Index number badge */}
                                    <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                                      isPrimary
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                                    }`}>
                                      {idx + 1}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="text-center">
                                    <p className="font-medium text-sm">Ảnh đại diện</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Nhấp để tải lên hoặc thay đổi ảnh đại diện cho vé tham dự
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
                                <RoleBadgeCompact role={registrant.event_roles} />
                              </div>
                            </div>
                            
                            {/* Additional info */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-current opacity-50"></span>
                                  {SHIRT_SIZES.filter((size) => size.value === registrant.shirt_size).map((size) => (
                                    <p key={size.value} className="text-sm">
                                      Size: {size.label}
                                    </p>
                                  ))}
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
                              {registrant.second_day_only && (
                                <span className="flex items-center gap-1 text-orange-600 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                  Chỉ tham dự :
                                  {new Date(registrant.selected_attendance_day || '2025-09-15').toLocaleDateString('vi-VN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
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
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                <div className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Ghi chú:
                </div>
                <div className="text-sm text-amber-800 dark:text-amber-200">{registration.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
