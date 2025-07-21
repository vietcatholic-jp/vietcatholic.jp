import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'registrations' or 'payments'

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

    // Get all registrations with related data for export
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

    return NextResponse.json({
      registrations: registrations || [],
      type
    });

  } catch (error) {
    console.error('Error fetching export data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}