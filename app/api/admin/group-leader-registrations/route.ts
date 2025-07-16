import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    if (!profile || !['group_leader', 'event_organizer', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    return NextResponse.json({
      registrations: registrations || [],
      totalCount: (registrations || []).length
    });

  } catch (error) {
    console.error("Group leader registrations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
