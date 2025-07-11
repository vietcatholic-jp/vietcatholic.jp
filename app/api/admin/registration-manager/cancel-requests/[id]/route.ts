import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("users")
      .select("role, region")
      .eq("id", user.id)
      .single();

    if (!profile || !["registration_manager","super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, admin_notes } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get the cancel request
    const { data: cancelRequest, error: fetchError } = await supabase
      .from('cancel_requests')
      .select(`
        *,
        registration:registrations(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !cancelRequest) {
      return NextResponse.json({ error: 'Cancel request not found' }, { status: 404 });
    }

    // Check if request is still pending
    if (cancelRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Cancel request already processed' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update cancel request
    const { error: updateError } = await supabase
      .from('cancel_requests')
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
        processed_by: user.id,
        admin_notes: admin_notes || null,
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // If approved, also update the registration status
    if (action === 'approve') {
      const { error: updateRegError } = await supabase
        .from('registrations')
        .update({
          status: 'cancel_accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', cancelRequest.registration_id);

      if (updateRegError) {
        throw updateRegError;
      }
    } else {
      // If rejected, update registration status back to previous state
      const { error: updateRegError } = await supabase
        .from('registrations')
        .update({
          status: 'cancel_rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', cancelRequest.registration_id);

      if (updateRegError) {
        throw updateRegError;
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing cancel request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
