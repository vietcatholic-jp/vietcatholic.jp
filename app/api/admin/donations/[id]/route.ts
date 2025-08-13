import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateDonationSchema = z.object({
  donor_name: z.string().min(1).optional(),
  contact: z.string().optional(),
  amount: z.number().min(1).optional(),
  public_identity: z.boolean().optional(),
  note: z.string().optional(),
  status: z.enum(['pledged', 'received']).optional(),
  received_at: z.string().optional(),
});

// UPDATE donation (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['super_admin', 'cashier_role']);
    const supabase = await createClient();
    const { id: donationId } = await params;
    
    const body = await request.json();
    const validatedData = UpdateDonationSchema.parse(body);

    // Get existing donation
    const { data: existingDonation, error: fetchError } = await supabase
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (fetchError || !existingDonation) {
      return NextResponse.json(
        { error: 'Không tìm thấy quyên góp' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...validatedData };
    
    // If marking as received, set received_at if not provided
    if (validatedData.status === 'received' && !validatedData.received_at) {
      updateData.received_at = new Date().toISOString();
    }

    // If marking as pledged, clear received_at
    if (validatedData.status === 'pledged') {
      updateData.received_at = null;
    }

    // Update donation
    const { data: updatedDonation, error: updateError } = await supabase
      .from('donations')
      .update(updateData)
      .eq('id', donationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating donation:', updateError);
      return NextResponse.json(
        { error: 'Không thể cập nhật quyên góp' },
        { status: 500 }
      );
    }

    // Log donation update
    if (validatedData.status === 'received' && existingDonation.status !== 'received') {
      console.log(`DONATION_RECEIVED: ${donationId} by admin ${user.id}`);
    }

    return NextResponse.json({
      success: true,
      data: updatedDonation,
      message: 'Quyên góp đã được cập nhật thành công'
    });

  } catch (error) {
    console.error('Error updating donation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi cập nhật quyên góp' },
      { status: 500 }
    );
  }
}

// DELETE donation (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['super_admin', 'regional_admin']);
    const supabase = await createClient();
    const { id: donationId } = await params;

    // Check if donation exists
    const { data: existingDonation, error: fetchError } = await supabase
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (fetchError || !existingDonation) {
      return NextResponse.json(
        { error: 'Không tìm thấy quyên góp' },
        { status: 404 }
      );
    }

    // Delete donation
    const { error: deleteError } = await supabase
      .from('donations')
      .delete()
      .eq('id', donationId);

    if (deleteError) {
      console.error('Error deleting donation:', deleteError);
      return NextResponse.json(
        { error: 'Không thể xóa quyên góp' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quyên góp đã được xóa thành công'
    });

  } catch (error) {
    console.error('Error deleting donation:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa quyên góp' },
      { status: 500 }
    );
  }
}