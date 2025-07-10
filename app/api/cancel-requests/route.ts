import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CancelRequestSchema = z.object({
  registration_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  request_type: z.enum(['refund', 'donation']).optional().default('refund'),
  bank_account_number: z.string().optional(),
  bank_name: z.string().optional(),
  account_holder_name: z.string().optional()
}).refine((data) => {
  if (data.request_type === 'refund') {
    return data.bank_account_number && 
           data.bank_name && 
           data.account_holder_name &&
           data.bank_account_number.length >= 5 &&
           data.bank_name.length >= 2 &&
           data.account_holder_name.length >= 2;
  }
  return true;
}, {
  message: 'Tài khoản ngân hàng là bắt buộc đối với yêu cầu hoàn tiền',
  path: ['bank_account_number']
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = CancelRequestSchema.parse(body);

    // Verify the registration belongs to the user and can be cancelled
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, status, total_amount, user_id')
      .eq('id', validated.registration_id)
      .eq('user_id', user.id)
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { error: 'Không tìm thấy đăng ký hoặc quyền truy cập bị từ chối' },
        { status: 404 }
      );
    }

    // Check if registration can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'report_paid','confirm_paid'];
    if (!cancellableStatuses.includes(registration.status)) {
      return NextResponse.json(
        { error: 'Không thể huỷ đăng ký trong trạng thái hiện tại' },
        { status: 400 }
      );
    }

    // Check if there's already a pending cancel request
    const { data: existingRequest } = await supabase
      .from('cancel_requests')
      .select('id, status')
      .eq('registration_id', validated.registration_id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Đã có yêu cầu huỷ đang chờ xử lý cho đăng ký này' },
        { status: 400 }
      );
    }

    // Create the cancel request or process donation
    if (validated.request_type === 'donation') {
      // For donations, directly cancel the registration without creating a cancel request
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          status: 'donation',
          notes: `Quyên góp: ${validated.reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.registration_id);

      if (updateError) {
        console.error('Lỗi cập nhật đăng ký cho quyên góp:', updateError);
        return NextResponse.json(
          { error: 'Không thể xử lý quyên góp' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Cảm ơn bạn đã đóng góp cho sự kiện. Đăng ký của bạn đã được huỷ.',
        type: 'donation'
      }, { status: 201 });
    }

    // For refunds, create a cancel request for admin processing
    const { data: cancelRequest, error: createError } = await supabase
      .from('cancel_requests')
      .insert({
        registration_id: validated.registration_id,
        user_id: user.id,
        reason: validated.reason,
        bank_account_number: validated.bank_account_number!,
        bank_name: validated.bank_name!,
        account_holder_name: validated.account_holder_name!,
        refund_amount: registration.total_amount,
        status: 'pending'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating cancel request:', createError);
      return NextResponse.json(
        { error: 'Không thể tạo yêu cầu huỷ' },
        { status: 500 }
      );
    }

    // Update registration status to indicate cancel request pending
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'cancel_pending',
        notes: `Lý do huỷ: ${validated.reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.registration_id);

    if (updateError) {
      console.error('Error updating registration status:', updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      ...cancelRequest,
      message: 'Yêu cầu huỷ đã được gửi thành công. Chúng tôi sẽ xử lý hoàn tiền sau ngày 15 tháng 9 trong vòng 7 ngày làm việc.',
      type: 'refund'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
	  console.error('Validation error:', error);
      return NextResponse.json(
        { error: 'Yêu cầu không hợp lệ', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating cancel request:', error);
    return NextResponse.json(
      { error: 'Không thể tạo yêu cầu huỷ' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's cancel requests
    const { data: cancelRequests, error } = await supabase
      .from('cancel_requests')
      .select(`
        *,
        registration:registrations(
          id,
          invoice_code,
          participant_count
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cancel requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cancel requests' },
        { status: 500 }
      );
    }

    return NextResponse.json(cancelRequests || []);
  } catch (error) {
    console.error('Error fetching cancel requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cancel requests' },
      { status: 500 }
    );
  }
}
