import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;
    const searchTerm = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'all';

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

    // Get registration statistics using RPC
    const { data: stats, error: statsError } = await supabase.rpc('get_registration_stats').single();
	
    if (statsError) {
      throw statsError;
    }

    // Get paginated and filtered registrations
    let query = supabase
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
      `, { count: 'exact' });

    if (searchTerm) {
      // Enhanced search across multiple fields
      query = query.or(`
        invoice_code.ilike.%${searchTerm}%,
        user.full_name.ilike.%${searchTerm}%,
        user.email.ilike.%${searchTerm}%,
        user.phone.ilike.%${searchTerm}%
      `);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    const { data: registrations, error: registrationsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
    console.log("Fetched registrations:", registrations[1].registrants);
    return NextResponse.json({
      stats,
      registrations,
      cancelRequests,
      totalPages: Math.ceil((count || 0) / limit),
    });

  } catch (error) {
    console.error('Error fetching registration manager data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
