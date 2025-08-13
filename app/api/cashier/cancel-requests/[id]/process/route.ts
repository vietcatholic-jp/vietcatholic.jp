import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ProcessCancelRequestSchema = z.object({
  admin_notes: z.string().optional(),
  event_config_id: z.string().uuid('Event ID phải là UUID hợp lệ'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['cashier_role', 'super_admin']);
    const supabase = await createClient();
    const { id: requestId } = await params;
    
    const body = await request.json();
    const validatedData = ProcessCancelRequestSchema.parse(body);

    // Get the cancel request and verify it exists and is in approved status
    const { data: cancelRequest, error: fetchError } = await supabase
      .from('cancel_requests')
      .select(`
        *,
        registration:registrations(
          id,
          status,
          user_id,
          event_config_id,
          user:users(full_name, email)
        ),
        user:users(full_name, email)
      `)
      .eq('id', requestId)
      .eq('event_config_id', validatedData.event_config_id)
      .single();

    if (fetchError || !cancelRequest) {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu hủy' },
        { status: 404 }
      );
    }

    if (cancelRequest.status !== 'approved') {
      return NextResponse.json(
        { error: 'Yêu cầu hủy phải được phê duyệt trước khi xử lý' },
        { status: 400 }
      );
    }

    // Update cancel request status to processed
    const { error: updateError } = await supabase
      .from('cancel_requests')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        processed_by: user.id,
        admin_notes: validatedData.admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error processing cancel request:', updateError);
      return NextResponse.json(
        { error: 'Không thể xử lý yêu cầu hủy' },
        { status: 500 }
      );
    }

    // Update the registration status to cancel_processed
    if (cancelRequest.registration) {
      const { error: regUpdateError } = await supabase
        .from('registrations')
        .update({
          status: 'cancel_processed',
          updated_at: new Date().toISOString()
        })
        .eq('id', cancelRequest.registration_id);

      if (regUpdateError) {
        console.error('Error updating registration status:', regUpdateError);
        // Don't fail the request, but log the error
      }
    }

    // Log the cancellation processing
    console.log(`CANCELLATION_PROCESSED: Cancel request ${requestId} for registration ${cancelRequest.registration_id} by cashier ${user.id}`);

    return NextResponse.json({
      id: requestId,
      status: 'processed',
      processedAt: new Date().toISOString(),
      processedBy: user.id,
      adminNotes: validatedData.admin_notes,
      refundAmount: cancelRequest.refund_amount,
      message: 'Yêu cầu hủy đã được xử lý thành công'
    });

  } catch (error) {
    console.error('Error processing cancel request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi xử lý yêu cầu hủy' },
      { status: 500 }
    );
  }
}