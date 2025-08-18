import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/auth';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Verify user authentication and role
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['registration_manager', 'event_organizer', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get total registrants count
    const { count, error: countError } = await supabase
      .from('registrants')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: 'Error counting registrants', details: countError }, { status: 500 });
    }

    // Get sample registrants with their registration status
    const { data: registrants, error } = await supabase
      .from('registrants')
      .select(`
        id,
        full_name,
        email,
        is_checked_in,
        checked_in_at,
        registrations!inner(
          id,
          status,
          invoice_code
        )
      `)
      .limit(10);

    if (error) {
      return NextResponse.json({ error: 'Error fetching registrants', details: error }, { status: 500 });
    }

    // Check confirmed registrations
    const { count: confirmedCount } = await supabase
      .from('registrants')
      .select('id, registrations!inner(status)', { count: 'exact', head: true })
      .eq('registrations.status', 'confirmed');

    // Check already checked-in
    const { count: checkedInCount } = await supabase
      .from('registrants')
      .select('id', { count: 'exact', head: true })
      .eq('is_checked_in', true);

    return NextResponse.json({
      totalRegistrants: count,
      confirmedRegistrants: confirmedCount || 0,
      checkedInRegistrants: checkedInCount || 0,
      sampleRegistrants: registrants.map(r => ({
        id: r.id,
        name: r.full_name,
        email: r.email,
        registrationStatus: r.registrations[0]?.status,
        invoiceCode: r.registrations[0]?.invoice_code,
        isCheckedIn: r.is_checked_in,
        checkedInAt: r.checked_in_at
      }))
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
