import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateExpenseRequestSchema = z.object({
  description: z.string().min(1, 'Mô tả là bắt buộc').optional(),
  amount: z.number().positive('Số tiền phải lớn hơn 0').optional(),
  approved_amount: z.number().min(0, 'Số tiền phê duyệt không được âm').optional(),
  bank_account_holder: z.string().min(1, 'Tên chủ tài khoản là bắt buộc').optional(),
  bank_name: z.string().min(1, 'Tên ngân hàng là bắt buộc').optional(),
  bank_account_number: z.string().min(1, 'Số tài khoản là bắt buộc').optional(),
  note: z.string().optional(),
  status: z.enum(['pending', 'approved', 'transferred', 'closed', 'rejected']).optional(),
  transfer_fee: z.number().min(0, 'Phí chuyển khoản không được âm').optional(),
  admin_notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const user = await requireRole(['super_admin', 'regional_admin', 'cashier_role']);
    const supabase = await createClient();
    const { expenseId } = await params;
    
    const body = await request.json();
    const validatedData = UpdateExpenseRequestSchema.parse(body);

    // Get the expense request to verify it exists
    const { data: expense, error: fetchError } = await supabase
      .from('expense_requests')
      .select('*')
      .eq('id', expenseId)
      .single();

    if (fetchError || !expense) {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu chi phí' },
        { status: 404 }
      );
    }

    // Get user role for permission checks
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userProfile?.role;

    // Role-based permission checks for status changes
    if (validatedData.status) {
      // Admins can approve/reject/close requests
      if (['approved', 'rejected', 'closed'].includes(validatedData.status)) {
        if (!['super_admin', 'regional_admin'].includes(userRole)) {
          return NextResponse.json(
            { error: 'Không có quyền thay đổi trạng thái này' },
            { status: 403 }
          );
        }
      }
      
      // Cashiers can mark approved requests as transferred
      if (validatedData.status === 'transferred') {
        if (!['cashier_role', 'super_admin'].includes(userRole)) {
          return NextResponse.json(
            { error: 'Không có quyền thay đổi trạng thái này' },
            { status: 403 }
          );
        }
        if (expense.status !== 'approved') {
          return NextResponse.json(
            { error: 'Chỉ có thể chuyển khoản cho yêu cầu đã được phê duyệt' },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data mapping UI fields -> DB columns
    const updateData: Record<string, unknown> = {};

    if (validatedData.description !== undefined) updateData.purpose = validatedData.description;
    if (validatedData.amount !== undefined) updateData.amount_requested = validatedData.amount;
    if (validatedData.approved_amount !== undefined) updateData.amount_approved = validatedData.approved_amount;
    if (validatedData.bank_account_holder !== undefined) updateData.bank_account_name = validatedData.bank_account_holder;
    if (validatedData.bank_name !== undefined) updateData.bank_name = validatedData.bank_name;
    if (validatedData.bank_account_number !== undefined) updateData.account_number = validatedData.bank_account_number;
    if (validatedData.note !== undefined) updateData.notes = validatedData.note;
    if (validatedData.admin_notes !== undefined) updateData.notes = validatedData.admin_notes; // store admin notes in same column
    if (validatedData.transfer_fee !== undefined) updateData.transfer_fee = validatedData.transfer_fee;

    if (validatedData.status) {
      const newStatus = validatedData.status === 'pending' ? 'submitted' : validatedData.status;
      updateData.status = newStatus;
      const now = new Date().toISOString();
      if (newStatus === 'approved' && expense.status !== 'approved') {
        updateData.approved_at = now;
        updateData.approved_by = user.id;
      }
      if (newStatus === 'transferred' && expense.status !== 'transferred') {
        updateData.processed_at = now;
        updateData.processed_by = user.id;
      }
      if (newStatus === 'closed' && expense.status !== 'closed') {
        // No dedicated columns for closed metadata in schema; keep status only
      }
    }

    // Update the expense request
    const { data: updatedExpense, error: updateError } = await supabase
      .from('expense_requests')
      .update(updateData)
      .eq('id', expenseId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating expense request:', updateError);
      return NextResponse.json(
        { error: 'Không thể cập nhật yêu cầu chi phí' },
        { status: 500 }
      );
    }

    // Log the expense request update
    console.log(`EXPENSE_REQUEST_UPDATED: ${expenseId} by ${user.id} - Status: ${validatedData.status || 'no change'}`);

    return NextResponse.json({
      ...updatedExpense,
      message: 'Yêu cầu chi phí đã được cập nhật thành công'
    });

  } catch (error) {
    console.error('Error updating expense request:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi cập nhật yêu cầu chi phí' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const user = await requireRole(['super_admin', 'regional_admin']);
    const supabase = await createClient();
    const { expenseId } = await params;

    // Get the expense request to verify it exists and check status
    const { data: expense, error: fetchError } = await supabase
      .from('expense_requests')
      .select('*')
      .eq('id', expenseId)
      .single();

    if (fetchError || !expense) {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu chi phí' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending (submitted) requests
    if (expense.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Chỉ có thể xóa yêu cầu chi phí đang chờ xử lý' },
        { status: 400 }
      );
    }

    // Delete the expense request
    const { error: deleteError } = await supabase
      .from('expense_requests')
      .delete()
      .eq('id', expenseId);

    if (deleteError) {
      console.error('Error deleting expense request:', deleteError);
      return NextResponse.json(
        { error: 'Không thể xóa yêu cầu chi phí' },
        { status: 500 }
      );
    }

    // Log the expense request deletion
    console.log(`EXPENSE_REQUEST_DELETED: ${expenseId} by ${user.id}`);

    return NextResponse.json({
      message: 'Yêu cầu chi phí đã được xóa thành công'
    });

  } catch (error) {
    console.error('Error deleting expense request:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa yêu cầu chi phí' },
      { status: 500 }
    );
  }
}