import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
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

    // Get registration statistics
    const { data: registrations, error: registrationsError } = await supabase
      .from('registrations')
      .select(`
        *,
        user:users(*),
        registrants(*),
        receipts(*)
      `)
      .order('created_at', { ascending: false });

    if (registrationsError) {
      throw registrationsError;
    }

    // Get cancel requests
    const { data: cancelRequests, error: cancelRequestsError } = await supabase
      .from('cancel_requests')
      .select(`
        *,
        registration:registrations(*),
        user:users!cancel_requests_user_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (cancelRequestsError) {
      throw cancelRequestsError;
    }

    // Calculate statistics
    const stats = {
      totalRegistrations: registrations.length,
      pendingPayments: registrations.filter(r => r.status === 'report_paid').length,
      confirmedRegistrations: registrations.filter(r => r.status === 'confirm_paid' || r.status === 'confirmed').length,
      rejectedPayments: registrations.filter(r => r.status === 'payment_rejected').length,
      cancelRequests: cancelRequests.filter(r => r.status === 'pending').length,
      totalAmount: registrations.reduce((sum, r) => sum + r.total_amount, 0),
      confirmedAmount: registrations
        .filter(r => r.status === 'confirm_paid' || r.status === 'confirmed')
        .reduce((sum, r) => sum + r.total_amount, 0),
    };

    return NextResponse.json({
      stats,
      registrations,
      cancelRequests,
    });

  } catch (error) {
    console.error('Error fetching registration manager data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
