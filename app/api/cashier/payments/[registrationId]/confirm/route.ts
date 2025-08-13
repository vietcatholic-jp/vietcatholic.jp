import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ConfirmPaymentSchema = z.object({
  admin_notes: z.string().optional(),
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
    const validatedData = ConfirmPaymentSchema.parse(body);

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
        { error: 'Trạng thái đăng ký không hợp lệ để xác nhận thanh toán' },
        { status: 400 }
      );
    }

    // Update registration status to confirm_paid
    const updateData: Record<string, unknown> = {
      status: 'confirm_paid',
      updated_at: new Date().toISOString(),
    };

    // Add admin notes if provided
    if (validatedData.admin_notes) {
      updateData.notes = validatedData.admin_notes;
    }

    const { error: updateError } = await supabase
      .from('registrations')
      .update(updateData)
      .eq('id', registrationId);

    if (updateError) {
      console.error('Error confirming payment:', updateError);
      return NextResponse.json(
        { error: 'Không thể xác nhận thanh toán' },
        { status: 500 }
      );
    }

    // Log the payment confirmation
    console.log(`PAYMENT_CONFIRMED: Registration ${registrationId} by cashier ${user.id}`);

    return NextResponse.json({
      id: registrationId,
      status: 'confirm_paid',
      processedAt: new Date().toISOString(),
      processedBy: user.id,
      message: 'Thanh toán đã được xác nhận thành công'
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi xác nhận thanh toán' },
      { status: 500 }
    );
  }
}