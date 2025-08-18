import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Verify user has appropriate role
    const user = await requireRole(['registration_manager', 'event_organizer', 'group_leader', 'regional_admin', 'super_admin', "cashier_role"]);
    const supabase = await createClient();
    
    // Get user profile for filtering
    const { data: profile } = await supabase
      .from('users')
      .select('role, region')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Calculate fee payment statistics
    let registrationsQuery = supabase
      .from('registrations')
      .select('id, status, total_amount, user:users!inner(region)');

    // Filter by region for regional admins
    if (profile.role === 'regional_admin' && profile.region) {
      registrationsQuery = registrationsQuery.eq('user.region', profile.region);
    }

    const { data: registrations, error: regError } = await registrationsQuery;

    if (regError) {
      console.error('Error fetching registrations for fee payment stats:', regError);
      return NextResponse.json({ error: 'Failed to fetch fee payment data' }, { status: 500 });
    }

    // Calculate stats
    const paymentStats = {
      totalReceived: registrations
        ?.filter(r => ['confirmed', 'confirm_paid'].includes(r.status))
        .reduce((sum, r) => sum + Number(r.total_amount), 0) || 0,
      pendingPayments: registrations?.filter(r => r.status === 'pending').length || 0,
      cancelRequests: 0, // Will be calculated below
      refundsPending: 0, // Will be calculated below
      totalRefunded: 0
    };

    // Fetch cancel requests
    let cancelQuery = supabase
      .from('cancel_requests')
      .select(`
        *,
        registration:registrations(
          id,
          invoice_code,
          user:users(full_name, email, region)
        ),
        user:users(full_name, email)
      `)
      .order('created_at', { ascending: false });

    // Filter cancel requests by region for regional admins
    if (profile.role === 'regional_admin' && profile.region) {
      cancelQuery = cancelQuery.eq('registration.user.region', profile.region);
    }

    const { data: cancelRequests, error: cancelError } = await cancelQuery;

    if (cancelError) {
      console.error('Error fetching cancel requests:', cancelError);
      // Don't fail the entire request, just log the error
    }

    // Update stats with cancel request data
    if (cancelRequests) {
      paymentStats.cancelRequests = cancelRequests.filter(cr => cr.status === 'pending').length;
      paymentStats.refundsPending = cancelRequests.filter(cr => cr.status === 'approved').length;
      paymentStats.totalRefunded = cancelRequests
        .filter(cr => cr.status === 'processed')
        .reduce((sum, cr) => sum + Number(cr.refund_amount), 0);
    }

    // Format cancel requests for frontend
    const formattedCancelRequests = cancelRequests?.map(cr => ({
      id: cr.id,
      registrationId: cr.registration_id,
      participantName: cr.registration?.user?.full_name || 'Unknown',
      amount: Number(cr.refund_amount),
      bankAccountInfo: {
        accountNumber: cr.bank_account_number,
        bankName: cr.bank_name,
        accountHolder: cr.account_holder_name
      },
      reason: cr.reason,
      status: cr.status,
      createdAt: cr.created_at,
      adminNotes: cr.admin_notes
    })) || [];

    return NextResponse.json({
      stats: paymentStats,
      cancelRequests: formattedCancelRequests
    });
  } catch (error) {
    console.error('Error fetching fee payment data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fee payment data' },
      { status: 500 }
    );
  }
}
