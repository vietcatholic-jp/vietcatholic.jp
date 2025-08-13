import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const ApproveExpenseSchema = z.object({
  amount_approved: z.number().min(1, 'Số tiền phê duyệt phải lớn hơn 0'),
  notes: z.string().optional(),
  event_config_id: z.string().uuid('Event ID phải là UUID hợp lệ'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Event holders (super_admin for now) can approve expense requests
    const user = await requireRole(['super_admin', 'regional_admin']);
    const supabase = await createClient();
    const { id: expenseId } = await params;
    
    const body = await request.json();
    const validatedData = ApproveExpenseSchema.parse(body);

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

    if (expenseRequest.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Yêu cầu chi tiêu đã được xử lý' },
        { status: 400 }
      );
    }

    // Update expense request to approved
    const { error: updateError } = await supabase
      .from('expense_requests')
      .update({
        status: 'approved',
        amount_approved: validatedData.amount_approved,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        notes: validatedData.notes,
      })
      .eq('id', expenseId);

    if (updateError) {
      console.error('Error approving expense request:', updateError);
      return NextResponse.json(
        { error: 'Không thể phê duyệt yêu cầu chi tiêu' },
        { status: 500 }
      );
    }

    // Log the expense approval
    console.log(`EXPENSE_APPROVED: ${expenseId} by ${user.id} with amount ${validatedData.amount_approved}`);

    return NextResponse.json({
      id: expenseId,
      status: 'approved',
      amount_approved: validatedData.amount_approved,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      notes: validatedData.notes,
      message: 'Yêu cầu chi tiêu đã được phê duyệt'
    });

  } catch (error) {
    console.error('Error approving expense request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi phê duyệt yêu cầu chi tiêu' },
      { status: 500 }
    );
  }
}