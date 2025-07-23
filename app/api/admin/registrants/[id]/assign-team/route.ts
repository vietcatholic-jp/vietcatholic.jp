import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const AssignTeamSchema = z.object({
  team_id: z.string().uuid("Invalid team ID"),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
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
      .from("user_profiles")
      .select("role, region")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { team_id, notes } = AssignTeamSchema.parse(body);
    const registrantId = params.id;

    // Get registrant details with registration info
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
      if (registrant.registration.user.region !== profile.region) {
        return NextResponse.json({ 
          error: "Cannot assign registrants from other regions" 
        }, { status: 403 });
      }
    }

    // Check if registrant is already assigned
    if (registrant.event_team_id) {
      return NextResponse.json({ 
        error: "Registrant is already assigned to a team" 
      }, { status: 400 });
    }

    // Validate team exists and get capacity info
    const { data: team, error: teamError } = await supabase
      .from("event_teams")
      .select(`
        id,
        name,
        capacity,
        registrants:registrants!registrants_event_team_id_fkey(id)
      `)
      .eq("id", team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check team capacity
    const currentSize = team.registrants?.length || 0;
    if (team.capacity && currentSize >= team.capacity) {
      return NextResponse.json({ 
        error: `Team is at full capacity (${currentSize}/${team.capacity})` 
      }, { status: 400 });
    }

    // Assign registrant to team
    const { error: updateError } = await supabase
      .from("registrants")
      .update({ 
        event_team_id: team_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", registrantId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: "Failed to assign team" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${registrant.full_name} has been assigned to ${team.name}`,
      data: {
        registrant_id: registrantId,
        team_id: team_id,
        team_name: team.name,
        notes
      }
    });

  } catch (error) {
    console.error("API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
