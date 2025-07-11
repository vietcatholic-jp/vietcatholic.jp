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
    const {
      status,
      notes,
      registrants,
    } = body;

    // Get the registration with related data
    const { data: registration, error: fetchError } = await supabase
      .from('registrations')
      .select(`
        *,
        user:users(*),
        registrants(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError || !registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Update registration
    const { error: updateRegError } = await supabase
      .from('registrations')
      .update({
        status,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateRegError) {
      throw updateRegError;
    }

    // Update registrants information if provided
    if (registrants && Array.isArray(registrants)) {
      for (const registrant of registrants) {
        const { error: updateRegistrantError } = await supabase
          .from('registrants')
          .update({
            full_name: registrant.full_name,
            saint_name: registrant.saint_name,
            phone: registrant.phone,
            facebook_link: registrant.facebook_link,
            updated_at: new Date().toISOString(),
          })
          .eq('id', registrant.id);

        if (updateRegistrantError) {
          throw updateRegistrantError;
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
