import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user info from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is admin
    if (!['super_admin', 'event_organizer', 'registration_manager'].includes(userData.role)) {
      return NextResponse.json({ error: "Forbidden - Role: " + userData.role }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'confirmed';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('registrants')
      .select(`
        id,
        full_name,
        saint_name,
        portrait_url,
        event_role:event_roles(name, description, team_name),
        registration:registrations!inner(status, invoice_code)
      `)
      .order('full_name')
      .range(offset, offset + limit - 1);

    // Filter by registration status if specified
    if (status !== 'all') {
      query = query.eq('registrations.status', status);
    }

    const { data: registrants, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: "Failed to fetch registrants" }, { status: 500 });
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('registrants')
      .select('id', { count: 'exact', head: true })
      .eq('registrations.status', status);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Count error:', countError);
    }

    return NextResponse.json({
      success: true,
      registrants: registrants || [],
      count: registrants?.length || 0,
      total: count || 0
    });

  } catch (error) {
    console.error('Error fetching registrants:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
