import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'registrations', 'registrants' or 'payments'
    const team_name = searchParams.get('team_name'); // Filter by team name

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

    if (!profile || !["registration_manager", "super_admin","cashier_role"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    if (type === 'registrants') {
      // Get registrants-level export with event_roles and team_name joins
      let query = supabase
        .from('registrants')
        .select(`
          *,
          registration:registrations(
            id,
            invoice_code,
            status,
            total_amount,
            participant_count,
            created_at,
            user:users(
              id,
              email,
              full_name,
              role,
              region,
              province
            )
          ),
          event_roles:event_role_id(
            id,
            name,
            team_name,
            description
          ),
          event_team:event_team_id(
            id,
            name
          )
        `)
        .limit(10000) // Explicitly set a high limit to override Supabase default
        .order('created_at', { ascending: false });

      // Apply team filter if specified
      if (team_name) {
        query = query.eq('event_roles.team_name', team_name);
      }

      const { data: registrants, error: registrantsError } = await query;
      if (registrantsError) {
        console.error('Error fetching registrants:', registrantsError);
        throw registrantsError;
      }

      return NextResponse.json({
        registrants: registrants || [],
        type: 'registrants',
        total_count: registrants?.length || 0,
        note: registrants?.length === 10000 ? 'Results may be truncated. Consider using pagination for very large datasets.' : null
      });
    } else {
      // Original registrations export
      const { data: registrations, error: registrationsError } = await supabase
        .from('registrations')
      .select(`
        *,
        user:users(*),
        registrants(
          *,
          event_roles:event_role_id(
            id,
            name,
            team_name,
            description
          )
        ),
        receipts(*)
      `)
      .limit(5000) // Set limit for registrations as well
      .order('created_at', { ascending: false });

      if (registrationsError) {
        throw registrationsError;
      }

      return NextResponse.json({
        registrations: registrations || [],
        type: type || 'registrations',
        total_count: registrations?.length || 0,
        note: registrations?.length === 5000 ? 'Results may be truncated. Consider using pagination for very large datasets.' : null
      });
    }

  } catch (error) {
    console.error('Error fetching export data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}