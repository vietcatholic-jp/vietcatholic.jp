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

    if (!profile || !["registration_manager", "super_admin"].includes(profile.role)) {
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
          event_role:event_roles(
            id,
            name,
            team_name,
            description
          )
        `)
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
        type: 'registrants'
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
            description
          )
        ),
        receipts(*)
      `)
      .order('created_at', { ascending: false });

      if (registrationsError) {
        throw registrationsError;
      }

      return NextResponse.json({
        registrations: registrations || [],
        type: type || 'registrations'
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