import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface Registrant {
  event_role?: string;
  [key: string]: unknown;
}

interface Registration {
  registrants?: Registrant[];
  [key: string]: unknown;
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has group leader permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role, region")
      .eq("id", user.id)
      .single();

    if (!profile || !['group_leader', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Group leaders can see confirmed registrations from their region
    // that contain registrants with group-related roles
    const groupRelatedRoles = [
      'organizer_regional',
      'organizer_core',
      'volunteer_media_leader',
      'volunteer_media_sub_leader',
      'volunteer_activity_leader',
      'volunteer_activity_sub_leader',
      'volunteer_discipline_leader',
      'volunteer_discipline_sub_leader',
      'volunteer_logistics_leader',
      'volunteer_logistics_sub_leader',
      'volunteer_liturgy_leader',
      'volunteer_liturgy_sub_leader',
      'volunteer_security_leader',
      'volunteer_security_sub_leader',
      'volunteer_registration_leader',
      'volunteer_registration_sub_leader',
      'volunteer_catering_leader',
      'volunteer_catering_sub_leader',
      'volunteer_health_leader',
      'volunteer_health_sub_leader',
      'volunteer_audio_light_leader',
      'volunteer_audio_light_sub_leader',
      'volunteer_group_leader',
      'volunteer_group_sub_leader'
    ];

    // First get all confirmed registrations with user data
    const { data: registrations, error } = await supabase
      .from("registrations")
      .select(`
        *,
        user:users(email, full_name, region, province),
        registrants(*)
      `)
      .eq("status", "confirmed");

    if (error) {
      console.error("Group leader registrations query error:", error);
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
    }

    // Filter registrations by group-related roles
    const filteredRegistrations = (registrations || []).filter((registration: Registration) => {
      // Check if registration has at least one registrant with a group-related role
      const hasGroupRole = registration.registrants?.some((registrant: Registrant) =>
        groupRelatedRoles.includes(registrant.event_role || '')
      );

      // Both super admin and group leaders can see all group registrations
      return hasGroupRole;
    });

    return NextResponse.json({ 
      registrations: filteredRegistrations,
      totalCount: filteredRegistrations.length,
      groupRelatedRoles
    });

  } catch (error) {
    console.error("Group leader registrations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
