import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST - Fix registrations without registrants
export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role && ["super_admin", "admin", "regional_admin"].includes(profile.role);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Find registrations without registrants
    const { data: allRegistrations, error: findError } = await supabase
      .from("registrations")
      .select(`
        id,
        user_id,
        invoice_code,
        status,
        created_at,
        registrants(id),
        users!registrations_user_id_fkey(
          email,
          full_name,
          province,
          facebook_url
        )
      `)
      .not("status", "in", "(cancelled,be_cancelled,cancel_accepted)");

    if (findError) {
      console.error("Error finding registrations:", findError);
      return NextResponse.json({ error: "Failed to find registrations" }, { status: 500 });
    }

    // Filter registrations that have no registrants
    const registrationsWithoutRegistrants = allRegistrations?.filter(
      reg => !reg.registrants || reg.registrants.length === 0
    ) || [];

    if (!registrationsWithoutRegistrants || registrationsWithoutRegistrants.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No registrations without registrants found",
        created: 0
      });
    }

    // Create primary registrants for each registration
    const registrantsToCreate = registrationsWithoutRegistrants.map(reg => {
      const userInfo = Array.isArray(reg.users) ? reg.users[0] : reg.users;
      return {
        registration_id: reg.id,
        email: userInfo?.email || '',
        full_name: userInfo?.full_name || 'Please Update Name',
        gender: 'other' as const,
        age_group: '18_25' as const,
        province: userInfo?.province || '',
        diocese: null,
        shirt_size: 'M' as const,
        is_primary: true,
        facebook_link: userInfo?.facebook_url || '',
        notes: 'Auto-created primary registrant - Please update all fields',
        created_at: reg.created_at, // Use registration creation time
        updated_at: new Date().toISOString()
      };
    });

    // Insert the registrants
    const { error: insertError } = await supabase
      .from("registrants")
      .insert(registrantsToCreate);

    if (insertError) {
      console.error("Error creating registrants:", insertError);
      return NextResponse.json({ error: "Failed to create registrants" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully created ${registrantsToCreate.length} primary registrants`,
      created: registrantsToCreate.length,
      registrations: registrationsWithoutRegistrants.map(r => ({
        id: r.id,
        invoice_code: r.invoice_code,
        status: r.status
      }))
    });

  } catch (error) {
    console.error("Fix registrants API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Check how many registrations need fixing
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role && ["super_admin", "registration_manager", "regional_admin"].includes(profile.role);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Count registrations without registrants
    // Use a different approach since the LEFT JOIN with is() doesn't work well with count
    const { data: allRegistrations, error: getAllError } = await supabase
      .from("registrations")
      .select(`
        id,
        invoice_code,
        status,
        created_at,
        registrants(id),
        users!registrations_user_id_fkey(
          email,
          full_name,
          province,
		  facebook_url
        )
      `)
      .not("status", "in", "(cancelled,be_cancelled,cancel_accepted)");

    if (getAllError) {
      console.error("Error fetching registrations:", getAllError);
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
    }

    // Count registrations that have no registrants
    const registrationsWithoutRegistrants = allRegistrations?.filter(
      reg => !reg.registrants || reg.registrants.length === 0
    ) || [];

    const count = registrationsWithoutRegistrants.length;

    return NextResponse.json({ 
      count: count || 0,
      message: count ? `Found ${count} registrations without registrants` : "No registrations need fixing",
      registrations: registrationsWithoutRegistrants.map(reg => ({
        id: reg.id,
        invoice_code: reg.invoice_code,
        status: reg.status,
        created_at: reg.created_at,
        user: Array.isArray(reg.users) ? reg.users[0] : reg.users
      }))
    });

  } catch (error) {
    console.error("Check registrants API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
