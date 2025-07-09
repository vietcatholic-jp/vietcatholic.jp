"use client";

import { Button } from "@/components/ui/button";
import { Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RegistrationActionsProps {
  registrationId: string;
  invoiceCode: string;
  status: string;
  registrantIds: string[];
}

export function RegistrationActions({ 
  registrationId, 
  invoiceCode, 
  status, 
  registrantIds 
}: RegistrationActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasTickets, setHasTickets] = useState(false);
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

  // Only show actions for pending registrations without tickets
  if (status !== 'pending' || hasTickets) {
    return null;
  }

  return (
    <>
      <Link href={`/register/${registrationId}`}>
        <Button size="sm" variant="outline">
          <Settings className="h-3 w-3 mr-1" />
          Chỉnh sửa
        </Button>
      </Link>
      <Button 
        size="sm" 
        variant="outline"
        className="text-red-600 hover:text-red-700"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-3 w-3 mr-1" />
        {isDeleting ? 'Đang xóa...' : 'Xóa'}
      </Button>
    </>
  );
}
