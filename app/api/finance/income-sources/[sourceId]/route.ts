import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateIncomeSourceSchema = z.object({
  category: z.enum(['ticket_sales', 'merchandise', 'food_beverage', 'other']).optional(),
  title: z.string().min(1, 'Tên nguồn thu là bắt buộc').optional(),
  description: z.string().optional(),
  amount: z.number().min(0, 'Số tiền phải lớn hơn hoặc bằng 0').optional(),
  expected_amount: z.number().min(0, 'Số tiền dự kiến phải lớn hơn hoặc bằng 0').optional(),
  status: z.enum(['pending', 'received', 'overdue']).optional(),
  contact_person: z.string().optional(),
  contact_info: z.string().optional(),
  due_date: z.string().optional().transform(val => val === '' ? undefined : val),
  received_date: z.string().optional().transform(val => val === '' ? undefined : val),
  notes: z.string().optional(),
});

// UPDATE income source
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ sourceId: string }> }
) {
  try {
    await requireRole(['super_admin','cashier_role', 'event_organizer']);
    const supabase = await createClient();

    const { sourceId } = await context.params;
    
    const payload = await request.json();
    const parsed = UpdateIncomeSourceSchema.parse(payload);

    // Get current income source to verify permissions
    const { data: existingSource, error: fetchError } = await supabase
      .from('income_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (fetchError || !existingSource) {
      return NextResponse.json(
        { error: 'Không tìm thấy nguồn thu' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (parsed.category !== undefined) updateData.category = parsed.category;
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.amount !== undefined) updateData.amount = parsed.amount;
    if (parsed.expected_amount !== undefined) updateData.expected_amount = parsed.expected_amount;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.contact_person !== undefined) updateData.contact_person = parsed.contact_person;
    if (parsed.contact_info !== undefined) updateData.contact_info = parsed.contact_info;
    if (parsed.due_date !== undefined) updateData.due_date = parsed.due_date;
    if (parsed.received_date !== undefined) updateData.received_date = parsed.received_date;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes;

    const { data, error } = await supabase
      .from('income_sources')
      .update(updateData)
      .eq('id', sourceId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating income source:', error);
      return NextResponse.json(
        { error: 'Không thể cập nhật nguồn thu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Đã cập nhật nguồn thu thành công'
    });
  } catch (error) {
    console.error('Error updating income source:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Không có quyền truy cập' },
      { status: 403 }
    );
  }
}

// DELETE income source
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ sourceId: string }> }
) {
  try {
    await requireRole(['super_admin', 'cashier_role']);
    const supabase = await createClient();

    const { sourceId } = await context.params;

    // Get current income source to verify it exists
    const { data: existingSource, error: fetchError } = await supabase
      .from('income_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (fetchError || !existingSource) {
      return NextResponse.json(
        { error: 'Không tìm thấy nguồn thu' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('income_sources')
      .delete()
      .eq('id', sourceId);

    if (error) {
      console.error('Error deleting income source:', error);
      return NextResponse.json(
        { error: 'Không thể xóa nguồn thu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Đã xóa nguồn thu thành công'
    });
  } catch (error) {
    console.error('Error deleting income source:', error);
    return NextResponse.json(
      { error: 'Không có quyền truy cập' },
      { status: 403 }
    );
  }
}
