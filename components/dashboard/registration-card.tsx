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
    receipts: { count: number };
    registrants: Registrant[];
    notes?: string;
  };
  isLast: boolean;
}

export function RegistrationCard({ registration, isLast }: RegistrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 border-green-200 text-green-800';
      case 'paid': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'pending': return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'cancelled': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thanh toán';
      case 'paid': return 'Đã thanh toán';
      case 'confirmed': return 'Đã xác nhận';
      case 'cancelled': return 'Đã hủy';
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
          />
          
          {registration.status === 'pending' && (
            <Link href={`/payment/${registration.invoice_code}`}>
              <Button size="sm" variant="outline" className="text-xs">
                <CreditCard className="h-3 w-3 mr-1" />
                Thanh toán
              </Button>
            </Link>
          )}
          
          {(registration.status === 'paid' || registration.status === 'confirmed') && (
            <Link href={`/tickets/${registration.invoice_code}`}>
              <Button size="sm" variant="outline" className="text-xs">
                <QrCode className="h-3 w-3 mr-1" />
                <span className="hidden xs:inline">Xem vé</span>
                <span className="xs:hidden">Vé</span>
              </Button>
            </Link>
          )}

          {(registration.status === 'confirmed') && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Hóa đơn:</span>
                <span className="font-medium">
                  {registration.receipts.count > 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Đã nộp
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Chưa nộp
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Vé:</span>
                <span className="font-medium">
                  {registration.status === 'confirmed' ? (
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

            {/* Registrants List */}
            {registration.registrants && registration.registrants.length > 0 && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  Danh sách tham gia ({registration.registrants.length} người):
                </div>
                <div className="space-y-2">
                  {registration.registrants.map((registrant, idx) => {
                    const roleInfo = EVENT_PARTICIPATION_ROLES.find(r => r.value === registrant.event_role);
                    return (
                      <div key={registrant.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">
                              {registrant.full_name}
                              {registrant.saint_name && (
                                <span className="text-muted-foreground ml-1">({registrant.saint_name})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {registrant.is_primary && (
                                <Badge variant="outline" className="text-xs">Chính</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{registrant.shirt_size}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
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
