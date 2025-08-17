import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const RejectPaymentSchema = z.object({
  admin_notes: z.string().min(1, 'Lý do từ chối là bắt buộc'),
  event_config_id: z.string().uuid('Event ID phải là UUID hợp lệ'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  try {
    const user = await requireRole(['cashier_role', 'super_admin']);
    const supabase = await createClient();
    const { registrationId } = await params;
    
    const body = await request.json();
    const validatedData = RejectPaymentSchema.parse(body);

    // Get the registration and verify it exists and is in correct status
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select(`
        *,
        user:users(full_name, email),
        receipts(*)
      `)
      .eq('id', registrationId)
      .eq('event_config_id', validatedData.event_config_id)
      .single();

    if (fetchError || !registration) {
      return NextResponse.json(
        { error: 'Không tìm thấy đăng ký' },
        { status: 404 }
      );
    }

    if (registration.status !== 'report_paid') {
      return NextResponse.json(
        { error: 'Trạng thái đăng ký không hợp lệ để từ chối thanh toán' },
        { status: 400 }
      );
    }

    // Update registration status to payment_rejected
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'payment_rejected',
        notes: validatedData.admin_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (updateError) {
      console.error('Error rejecting payment:', updateError);
      return NextResponse.json(
        { error: 'Không thể từ chối thanh toán' },
        { status: 500 }
      );
    }

    // Log the payment rejection
    console.log(`PAYMENT_REJECTED: Registration ${registrationId} by cashier ${user.id}: ${validatedData.admin_notes}`);

    return NextResponse.json({
      id: registrationId,
      status: 'payment_rejected',
      processedAt: new Date().toISOString(),
      processedBy: user.id,
      adminNotes: validatedData.admin_notes,
      message: 'Thanh toán đã được từ chối'
    });

  } catch (error) {
    console.error('Error rejecting payment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi từ chối thanh toán' },
      { status: 500 }
    );
  }
}