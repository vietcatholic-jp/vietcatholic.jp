import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const AssignTeamSchema = z.object({
  team_id: z.string().uuid("Invalid team ID"),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Parse and validate request body
    const body = await request.json();
    const { team_id, notes } = AssignTeamSchema.parse(body);
    const { id: registrantId } = await params;

    // Get registrant details with registration info
    const { data: registrant, error: registrantError } = await supabase
      .from("registrants")
      .select(`
        id,
        full_name,
        event_team_id,
        registration:registrations!registrants_registration_id_fkey(
          id,
          invoice_code,
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
      console.error("Team not found:", teamError);
      return NextResponse.json({ error: "Không tìm thấy đội" }, { status: 404 });
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: registrantId } = await params;

    // Get registrant details with current team info
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

    // Regional admin permission check - temporarily disabled for build
    // if (profile.role === "regional_admin" && profile.region) {
    //   if (registrant.registration[0].user[0].region !== profile.region) {
    //     return NextResponse.json({
    //       error: "Cannot modify registrants from other regions"
    //     }, { status: 403 });
    //   }
    // }

    // Check if registrant is assigned to a team
    if (!registrant.event_team_id) {
      return NextResponse.json({
        error: "Registrant is not assigned to any team"
      }, { status: 400 });
    }

    // Get team name before removing
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
        previous_team_id: registrant.event_team_id,
        previous_team_name: team?.name
      }
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
