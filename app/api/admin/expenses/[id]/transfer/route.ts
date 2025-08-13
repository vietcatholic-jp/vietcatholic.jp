import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const TransferExpenseSchema = z.object({
  transfer_receipt_url: z.string().url('URL biên lai chuyển khoản không hợp lệ').optional(),
  transfer_fee: z.number().min(0, 'Phí chuyển khoản không thể âm').optional(),
  notes: z.string().optional(),
  event_config_id: z.string().uuid('Event ID phải là UUID hợp lệ'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Cashiers can mark expenses as transferred
    const user = await requireRole(['cashier_role', 'super_admin']);
    const supabase = await createClient();
    const { id: expenseId } = await params;
    
    const body = await request.json();
    const validatedData = TransferExpenseSchema.parse(body);

    // Get the expense request
    const { data: expenseRequest, error: fetchError } = await supabase
      .from('expense_requests')
      .select(`
        *,
        event_config:event_configs(id, name),
        user:users(full_name, email)
      `)
      .eq('id', expenseId)
      .eq('event_config_id', validatedData.event_config_id)
      .single();

    if (fetchError || !expenseRequest) {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu chi tiêu' },
        { status: 404 }
      );
    }

    if (expenseRequest.status !== 'approved') {
      return NextResponse.json(
        { error: 'Yêu cầu chi tiêu phải được phê duyệt trước khi chuyển khoản' },
        { status: 400 }
      );
    }

    // Update expense request to transferred
    const { error: updateError } = await supabase
      .from('expense_requests')
      .update({
        status: 'transferred',
        processed_by: user.id,
        processed_at: new Date().toISOString(),
        transfer_receipt_url: validatedData.transfer_receipt_url,
        transfer_fee: validatedData.transfer_fee || 0,
        notes: validatedData.notes || expenseRequest.notes,
      })
      .eq('id', expenseId);

    if (updateError) {
      console.error('Error marking expense as transferred:', updateError);
      return NextResponse.json(
        { error: 'Không thể cập nhật trạng thái chuyển khoản' },
        { status: 500 }
      );
    }

    // Log the expense transfer
    console.log(`EXPENSE_TRANSFERRED: ${expenseId} by cashier ${user.id} with fee ${validatedData.transfer_fee || 0}`);

    return NextResponse.json({
      id: expenseId,
      status: 'transferred',
      processed_at: new Date().toISOString(),
      processed_by: user.id,
      transfer_receipt_url: validatedData.transfer_receipt_url,
      transfer_fee: validatedData.transfer_fee || 0,
      notes: validatedData.notes,
      message: 'Yêu cầu chi tiêu đã được chuyển khoản'
    });

  } catch (error) {
    console.error('Error marking expense as transferred:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi cập nhật trạng thái chuyển khoản' },
      { status: 500 }
    );
  }
}