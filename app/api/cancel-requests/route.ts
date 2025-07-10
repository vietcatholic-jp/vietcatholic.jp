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
  message: 'Bank information is required for refund requests',
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
        { error: 'Registration not found or access denied' },
        { status: 404 }
      );
    }

    // Check if registration can be cancelled
    const cancellableStatuses = ['pending', 'report_paid', 'confirm_paid', 'payment_rejected'];
    if (!cancellableStatuses.includes(registration.status)) {
      return NextResponse.json(
        { error: 'Registration cannot be cancelled in current status' },
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
        { error: 'A cancel request is already pending for this registration' },
        { status: 400 }
      );
    }

    // Create the cancel request or process donation
    if (validated.request_type === 'donation') {
      // For donations, directly cancel the registration without creating a cancel request
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          status: 'cancelled',
          notes: `Donation: ${validated.reason}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.registration_id);

      if (updateError) {
        console.error('Error updating registration for donation:', updateError);
        return NextResponse.json(
          { error: 'Failed to process donation' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Thank you for your donation! Registration has been cancelled.',
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
        { error: 'Failed to create cancel request' },
        { status: 500 }
      );
    }

    // Update registration status to indicate cancel request pending
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        status: 'cancelled',
        notes: `Cancel request submitted: ${validated.reason}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.registration_id);

    if (updateError) {
      console.error('Error updating registration status:', updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      ...cancelRequest,
      message: 'Cancel request submitted successfully. We will process your refund within 3-5 business days.',
      type: 'refund'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating cancel request:', error);
    return NextResponse.json(
      { error: 'Failed to create cancel request' },
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
