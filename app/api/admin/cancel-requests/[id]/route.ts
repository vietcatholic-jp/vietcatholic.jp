import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user has appropriate role
    const user = await requireRole(['event_organizer', 'super_admin']);
    const supabase = await createClient();
    
    const { action } = await request.json();
    const { id: requestId } = await params;
    
    if (!['approve', 'reject', 'processed'].includes(action)) {
      return NextResponse.json(
        { error: `Thao tác không hợp lệ ${action}` },
        { status: 400 }
      );
    }

    // Get the cancel request
    const { data: cancelRequest, error: fetchError } = await supabase
      .from('cancel_requests')
      .select(`
        *,
        registration:registrations(id, status, user_id),
        user:users(full_name, email)
      `)
      .eq('id', requestId)
      .single();

    if (fetchError || !cancelRequest) {
      return NextResponse.json(
        { error: 'Cancel request not found' },
        { status: 404 }
      );
    }

    if (cancelRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cancel request has already been processed' },
        { status: 400 }
      );
    }

    // Update the cancel request status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await supabase
      .from('cancel_requests')
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
        processed_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating cancel request:', updateError);
      return NextResponse.json(
        { error: 'Failed to update cancel request' },
        { status: 500 }
      );
    }

    // If approved, update the registration status to cancelled
    if (action === 'approve') {
      const { error: regUpdateError } = await supabase
        .from('registrations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', cancelRequest.registration_id);

      if (regUpdateError) {
        console.error('Error updating registration status:', regUpdateError);
        // Don't fail the request, but log the error
      }
    }

    return NextResponse.json({
      id: requestId,
      status: newStatus,
      processedAt: new Date().toISOString(),
      processedBy: user.id
    });
  } catch (error) {
    console.error('Error updating cancel request:', error);
    return NextResponse.json(
      { error: 'Failed to update cancel request' },
      { status: 500 }
    );
  }
}
