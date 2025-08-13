import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const UpdateDonationSchema = z.object({
  donor_name: z.string().min(1, 'Tên người quyên góp là bắt buộc').optional(),
  contact: z.string().optional(),
  amount: z.number().positive('Số tiền phải lớn hơn 0').optional(),
  public_identity: z.boolean().optional(),
  note: z.string().optional(),
  status: z.enum(['pledged', 'received']).optional(),
  received_at: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ donationId: string }> }
) {
  try {
    const user = await requireRole(['super_admin', 'regional_admin']);
    const supabase = await createClient();
    const { donationId } = await params;
    
    const body = await request.json();
    const validatedData = UpdateDonationSchema.parse(body);

    // Get the donation to verify it exists
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (fetchError || !donation) {
      return NextResponse.json(
        { error: 'Không tìm thấy quyên góp' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...validatedData,
      received_at: new Date().toISOString(),
    };

    // If status is being changed to 'received', set received_at
    if (validatedData.status === 'received' && donation.status !== 'received') {
      updateData.received_at = new Date().toISOString();
    }

    // Update the donation
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

    // Log the donation update
    console.log(`DONATION_UPDATED: ${donationId} by ${user.id}`);

    return NextResponse.json({
      ...updatedDonation,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ donationId: string }> }
) {
  try {
    const user = await requireRole(['super_admin', 'regional_admin']);
    const supabase = await createClient();
    const { donationId } = await params;

    // Get the donation to verify it exists
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .single();

    if (fetchError || !donation) {
      return NextResponse.json(
        { error: 'Không tìm thấy quyên góp' },
        { status: 404 }
      );
    }

    // Delete the donation
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

    // Log the donation deletion
    console.log(`DONATION_DELETED: ${donationId} by ${user.id}`);

    return NextResponse.json({
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