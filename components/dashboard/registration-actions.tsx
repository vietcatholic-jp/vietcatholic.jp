"use client";

import { Button } from "@/components/ui/button";
import { Settings, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CancelRequestForm } from "./cancel-request-form";

interface RegistrationActionsProps {
  registrationId: string;
  invoiceCode: string;
  status: string;
  registrantIds: string[];
  totalAmount: number;
  participantCount: number;
  eventConfig?: {
    cancellation_deadline?: string;
  } | null;
}

export function RegistrationActions({ 
  registrationId, 
  invoiceCode, 
  status, 
  registrantIds,
  totalAmount,
  participantCount,
  eventConfig
}: RegistrationActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasTickets, setHasTickets] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const router = useRouter();

  // Check if any registrants have tickets
  useEffect(() => {
    const checkTickets = async () => {
      if (registrantIds.length === 0) return;
      
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('registrant_id', registrantIds);
      
      setHasTickets((count || 0) > 0);
    };

    checkTickets();
  }, [registrantIds]);

  const handleCancel = async () => {
    setShowCancelForm(true);
  };

  // Check if cancellation is allowed based on event config
  const canCancel = () => {
    // Can cancel if status allows cancellation
    //const cancellableStatuses = ['pending', 'report_paid', 'confirm_paid', 'payment_rejected'];
    //if (!cancellableStatuses.includes(status)) {
    //  return false;
    //}

    // Check cancellation deadline if exists
    if (eventConfig?.cancellation_deadline) {
      const deadline = new Date(eventConfig.cancellation_deadline);
      const now = new Date();
      if (now > deadline) {
        return false;
      }
    }

    return !hasTickets;
  };

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đăng ký #${invoiceCode}?`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Delete failed');
      }

      console.log('Delete response:', result);
      toast.success("Xóa đăng ký thành công!");
      // Use router.refresh() to refresh the server component data
      router.refresh();
      // Also reload the page as a fallback
      setTimeout(() => window.location.reload(), 500);
      
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi xóa đăng ký");
    } finally {
      setIsDeleting(false);
    }
  };

  const showCancelButton = () => {
    // Show cancel button for paid statuses
    const cancellableStatuses = ['confirmed'];
    return cancellableStatuses.includes(status) && canCancel();
  };

  // Show actions based on registration status and user permissions
  const showEditButton = () => {
    // Allow editing for pending and payment_rejected status (before payment is confirmed)
    if (status === 'pending' || status === 'payment_rejected') {
      return !hasTickets;
    }
    return false;
  };

  const showDeleteButton = () => {
    // Allow deletion for pending and payment_rejected status only
    if (status === 'pending') {
      return !hasTickets;
    }
    return false;
  };

  // Don't show any actions if user can't modify the registration
  if (!showEditButton() && !showDeleteButton() && !showCancelButton()) {
    return null;
  }

  return (
    <>
      {showEditButton() && (
        <Link href={`/register/${registrationId}`}>
          <Button size="sm" variant="outline" className="text-xs">
            <Settings className="h-3 w-3 mr-1" />
            Chỉnh sửa
          </Button>
        </Link>
      )}
      {showCancelButton() && (
        <Button 
          size="sm" 
          variant="outline"
          className="text-orange-600 hover:text-orange-700 text-xs"
          onClick={handleCancel}
        >
          <XCircle className="h-3 w-3 mr-1" />
          Yêu cầu hủy
        </Button>
      )}
      {showDeleteButton() && (
        <Button 
          size="sm" 
          variant="outline"
          className="text-red-600 hover:text-red-700 text-xs"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          {isDeleting ? 'Đang huỷ...' : 'Huỷ đăng ký'}
        </Button>
      )}

      {/* Cancel Request Form Dialog */}
      <CancelRequestForm
        registration={{
          id: registrationId,
          invoice_code: invoiceCode,
          total_amount: totalAmount,
          participant_count: participantCount
        }}
        isOpen={showCancelForm}
        onClose={() => setShowCancelForm(false)}
        onSuccess={() => {
          router.refresh();
          setTimeout(() => window.location.reload(), 500);
        }}
      />
    </>
  );
}
