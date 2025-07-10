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

    if (!profile || profile.role !== "group_leader") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Group leaders can see confirmed registrations from their region
    // that contain registrants with group-related roles
    const groupRelatedRoles = [
      'organizer_regional',
      'organizer_core',
      'volunteer_media',
      'volunteer_logistics',
      'volunteer_liturgy',
      'volunteer_security',
      'volunteer_registration',
      'volunteer_catering'
    ];

    const { data: registrations, error } = await supabase
      .from("registrations")
      .select(`
        *,
        user:users(email, full_name, region, province),
        registrants(*)
      `)
      .eq("status", "confirmed")
      .eq("user.region", profile.region);

    if (error) {
      console.error("Group leader registrations query error:", error);
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
    }

    // Filter registrations that have at least one registrant with a group-related role
    const filteredRegistrations = (registrations || []).filter((registration: Registration) => 
      registration.registrants?.some((registrant: Registrant) => 
        groupRelatedRoles.includes(registrant.event_role || '')
      )
    );

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
