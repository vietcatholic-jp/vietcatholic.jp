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

    // Check if user is super_admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Only super admin can access backup exports" }, { status: 403 });
    }

    // Get ALL registrations with ALL related data for backup
    const { data: registrations, error: registrationsError } = await supabase
      .from('registrations')
      .select(`
        *,
        user:users(*),
        registrants(*, tickets(*)),
        receipts(*)
      `)
      .order('created_at', { ascending: false });

    if (registrationsError) {
      console.error('Error fetching backup data:', registrationsError);
      throw registrationsError;
    }

    // Also get additional data for comprehensive backup
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: eventConfigs } = await supabase
      .from('event_configs')
      .select('*');

    const { data: eventTeams } = await supabase
      .from('event_teams')
      .select('*');

    const { data: eventRoles } = await supabase
      .from('event_roles')
      .select('*');

    const { data: groups } = await supabase
      .from('groups')
      .select('*');

    const { data: cancelRequests } = await supabase
      .from('cancel_requests')
      .select('*');

    // Get tickets separately since they're related to registrants
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*');

    // Get ticket frames
    const { data: ticketFrames } = await supabase
      .from('ticket_frames')
      .select('*');

    // Return comprehensive backup data
    return NextResponse.json({
      registrations: registrations || [],
      users: users || [],
      event_configs: eventConfigs || [],
      event_teams: eventTeams || [],
      event_roles: eventRoles || [],
      groups: groups || [],
      cancel_requests: cancelRequests || [],
      tickets: tickets || [],
      ticket_frames: ticketFrames || [],
      backup_timestamp: new Date().toISOString(),
      total_registrations: registrations?.length || 0,
      total_registrants: registrations?.reduce((sum, reg) => sum + (reg.registrants?.length || 0), 0) || 0
    });

  } catch (error) {
    console.error('Error in backup export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}