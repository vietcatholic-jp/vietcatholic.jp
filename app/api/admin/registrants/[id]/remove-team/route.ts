import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("users")
      .select("role, region")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "registration_manager", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const registrantId = params.id;

    // Get registrant details
    const { data: registrant, error: registrantError } = await supabase
      .from("registrants")
      .select(`
        id,
        full_name,
        event_team_id,
        registration:registrations!registrants_registration_id_fkey(
          id,
          user:users!registrations_user_id_fkey(
            region
          )
        )
      `)
      .eq("id", registrantId)
      .single();

    if (registrantError || !registrant) {
      return NextResponse.json({ error: "Registrant not found" }, { status: 404 });
    }

    // Regional admin permission check
    if (profile.role === "regional_admin" && profile.region) {
      if (registrant.registration[0].user[0].region !== profile.region) {
        return NextResponse.json({ 
          error: "Cannot modify registrants from other regions" 
        }, { status: 403 });
      }
    }

    // Check if registrant is assigned to a team
    if (!registrant.event_team_id) {
      return NextResponse.json({ 
        error: "Registrant is not assigned to any team" 
      }, { status: 400 });
    }

    // Get team name for response
    const { data: team } = await supabase
      .from("event_teams")
      .select("name")
      .eq("id", registrant.event_team_id)
      .single();

    // Remove from team
    const { error: updateError } = await supabase
      .from("registrants")
      .update({ 
        event_team_id: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", registrantId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: "Failed to remove from team" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${registrant.full_name} has been removed from ${team?.name || 'team'}`,
      data: {
        registrant_id: registrantId,
        previous_team_name: team?.name
      }
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
