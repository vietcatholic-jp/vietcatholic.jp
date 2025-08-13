import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CloseExpenseSchema = z.object({
  notes: z.string().optional(),
  event_config_id: z.string().uuid('Event ID phải là UUID hợp lệ'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admins can close expense requests
    const user = await requireRole(['super_admin', 'regional_admin']);
    const supabase = await createClient();
    const { id: expenseId } = await params;
    
    const body = await request.json();
    const validatedData = CloseExpenseSchema.parse(body);

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

    if (expenseRequest.status !== 'transferred') {
      return NextResponse.json(
        { error: 'Yêu cầu chi tiêu phải được chuyển khoản trước khi đóng' },
        { status: 400 }
      );
    }

    // Update expense request to closed
    const { error: updateError } = await supabase
      .from('expense_requests')
      .update({
        status: 'closed',
        notes: validatedData.notes || expenseRequest.notes,
      })
      .eq('id', expenseId);

    if (updateError) {
      console.error('Error closing expense request:', updateError);
      return NextResponse.json(
        { error: 'Không thể đóng yêu cầu chi tiêu' },
        { status: 500 }
      );
    }

    // Log the expense closure
    console.log(`EXPENSE_CLOSED: ${expenseId} by admin ${user.id}`);

    return NextResponse.json({
      id: expenseId,
      status: 'closed',
      notes: validatedData.notes,
      message: 'Yêu cầu chi tiêu đã được đóng'
    });

  } catch (error) {
    console.error('Error closing expense request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi đóng yêu cầu chi tiêu' },
      { status: 500 }
    );
  }
}