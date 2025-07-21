import { notFound, redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { PaymentInstructions } from "@/components/payment/payment-instructions";
import { ReceiptUpload } from "@/components/payment/receipt-upload";
import { Registrant } from "@/lib/types";
import { 
  FileText,
} from "lucide-react";
import Link from "next/link";

interface PaymentPageProps {
  params: Promise<{
    invoiceCode: string;
  }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { invoiceCode } = await params;
  const user = await getServerUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const supabase = await createClient();

  // Get registration details
  const { data: registration, error } = await supabase
    .from('registrations')
    .select(`
      *,
      registrants(*),
      receipts(*)
    `)
    .eq('invoice_code', invoiceCode)
    .eq('user_id', user.id)
    .single();

  if (error || !registration) {
    notFound();
  }

  // If already paid, redirect to tickets page
  if (registration.status === 'confirmed' || registration.status === 'checked_in') {
    redirect(`/tickets/${invoiceCode}`);
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-4">
              Thanh toán đăng ký
            </h1>
            <p className="text-muted-foreground">
              Mã đăng ký: <span className="font-mono font-medium">{registration.invoice_code}</span>
            </p>
            <p className="text-muted-foreground">
              <ul className="text-sm text-amber-800 space-y-1 ml-6 list-disc">
                <li>Hạn chuyển khoản là 10 ngày kể từ ngày đăng ký và trước ngày 10/09/2025</li>
                <li>Vui lòng chuyển khoản trước ngày <strong className="text-xl">{new Date(new Date(registration.created_at).getTime() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}</strong> </li>
              </ul>
            </p>
            <p className="text-muted-foreground mt-2 mb-2">
              Bạn có thể quay lại trang này để xem hướng dẫn thanh toán và tải lên biên lai sau khi chuyển khoản.
            </p>
            <Link className="mt-2 border border-blue-500 p-2 rounded-md hover:bg-blue-600 hover:text-white dark:border-blue-700 dark:hover:bg-blue-700" href={`/dashboard`}>
              Quay lại quản lý đăng ký
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Registration Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Thông tin đăng ký
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <Badge variant="secondary">
                      {registration.status === 'pending' && 'Chờ thanh toán'}
                      {registration.status === 'report_paid' && 'Đã báo thanh toán'}
                      {registration.status === 'confirm_paid' && 'Đã xác nhận thanh toán'}
                      {registration.status === 'payment_rejected' && 'Thanh toán bị từ chối'}
                      
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số người tham gia:</span>
                    <span className="font-medium">{registration.participant_count}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày đăng ký:</span>
                    <span>{new Date(registration.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng chi phí:</span>
                      <span>¥{registration.total_amount.toLocaleString()}</span>
                    </div>
                  </div>

                  {registration.notes && (
                    <div className="border-t pt-4">
                      <span className="text-muted-foreground text-sm">Ghi chú:</span>
                      <p className="text-sm mt-1">{registration.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Participants List */}
              <Card>
                <CardHeader>
                  <CardTitle>Danh sách người tham gia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {registration.registrants?.map((registrant: Registrant, index: number) => (
                      <div key={registrant.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <span className="font-medium">{registrant.full_name}</span>
                          {registrant.saint_name && (
                            <span className="text-muted-foreground ml-2">({registrant.saint_name})</span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Instructions and Receipt Upload */}
            <div className="space-y-6">
              <PaymentInstructions 
                registrationDate={registration.created_at}
                amount={registration.total_amount}
                invoiceCode={registration.invoice_code}
              />
              
              <ReceiptUpload 
                invoiceCode={registration.invoice_code}
                hasExistingReceipts={Array.isArray(registration.receipts) && registration.receipts.length > 0}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
