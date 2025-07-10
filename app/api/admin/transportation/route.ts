import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Verify user has appropriate role
    const user = await requireRole(['regional_admin', 'super_admin']);
    const supabase = await createClient();
    
    // Get user profile to determine region access
    const { data: profile } = await supabase
      .from('users')
      .select('role, region')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Build query based on user role and region
    let query = supabase
      .from('transportation_groups')
      .select(`
        *,
        creator:created_by(id, full_name, email),
        registrations:transportation_registrations(
          id,
          registrant:registrants(id, full_name, registration_id),
          emergency_contact_name,
          emergency_contact_phone,
          special_needs
        )
      `)
      .order('created_at', { ascending: false });

    // Regional admins can only see their region's groups
    if (profile.role === 'regional_admin' && profile.region) {
      query = query.eq('region', profile.region);
    }

    const { data: transportationGroups, error } = await query;

    if (error) {
      console.error('Error fetching transportation groups:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transportation groups' },
        { status: 500 }
      );
    }

    return NextResponse.json(transportationGroups || []);
  } catch (error) {
    console.error('Error fetching transportation groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transportation groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user has appropriate role
    const user = await requireRole(['regional_admin', 'super_admin']);
    const supabase = await createClient();
    
    const body = await request.json();
    
    // Validate required fields
    const { name, region, departure_location, departure_time, capacity, vehicle_type, contact_person, contact_phone, notes } = body;
    
    if (!name || !region || !departure_location || !departure_time || !capacity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('users')
      .select('role, region')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Regional admins can only create groups for their region
    if (profile.role === 'regional_admin' && profile.region !== region) {
      return NextResponse.json(
        { error: 'You can only create transportation groups for your region' },
        { status: 403 }
      );
    }

    // Insert new transportation group
    const { data: newGroup, error } = await supabase
      .from('transportation_groups')
      .insert({
        name,
        region,
        departure_location,
        departure_time,
        capacity: parseInt(capacity),
        vehicle_type: vehicle_type || 'bus',
        contact_person,
        contact_phone,
        notes,
        created_by: user.id
      })
      .select(`
        *,
        creator:created_by(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating transportation group:', error);
      return NextResponse.json(
        { error: 'Failed to create transportation group' },
        { status: 500 }
      );
    }

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating transportation group:', error);
    return NextResponse.json(
      { error: 'Failed to create transportation group' },
      { status: 500 }
    );
  }
}
