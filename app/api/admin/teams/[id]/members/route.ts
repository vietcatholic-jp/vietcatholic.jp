import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await context.params;
    
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from("event_teams")
      .select(`
        *,
        leader:users!event_teams_leader_id_fkey(id, full_name, email),
        sub_leader:users!event_teams_sub_leader_id_fkey(id, full_name, email),
        event_config:event_configs!event_teams_event_config_id_fkey(name, is_active)
      `)
      .eq("id", teamId)
      .single();

    if (teamError) {
      console.error("Team query error:", teamError);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get team members (registrants assigned to this team)
    const { data: members, error: membersError } = await supabase
      .from("registrants")
      .select(`
        *,
        registration:registrations!registrants_registration_id_fkey(
          id,
          user_id,
          status,
          user:users!registrations_user_id_fkey(id, full_name, email, phone)
        ),
        event_role:event_roles!registrants_event_role_id_fkey(id, name, description)
      `)
      .eq("event_team_id", teamId)
      .order("created_at");

    if (membersError) {
      console.error("Members query error:", membersError);
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
    }

    return NextResponse.json({
      team,
      members: members || [],
      member_count: members?.length || 0,
    });
  } catch (error) {
    console.error("Team members API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await context.params;
    
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { registrant_ids } = await request.json();

    if (!registrant_ids || !Array.isArray(registrant_ids) || registrant_ids.length === 0) {
      return NextResponse.json({ error: "Registrant IDs are required" }, { status: 400 });
    }

    // Verify team exists
    const { data: team, error: teamError } = await supabase
      .from("event_teams")
      .select("id, event_config_id")
      .eq("id", teamId)
      .single();

    if (teamError) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Verify all registrants exist and belong to the same event
    const { data: registrants, error: registrantsError } = await supabase
      .from("registrants")
      .select(`
        id,
        registration:registrations!registrants_registration_id_fkey(
          event_config_id
        )
      `)
      .in("id", registrant_ids);

    if (registrantsError) {
      console.error("Registrants query error:", registrantsError);
      return NextResponse.json({ error: "Failed to verify registrants" }, { status: 500 });
    }

    // Check if all registrants belong to the same event as the team
    const invalidRegistrants = registrants?.filter(r => 
      r.registration && Array.isArray(r.registration) && r.registration.length > 0
        ? r.registration[0].event_config_id !== team.event_config_id
        : false
    );

    if (invalidRegistrants && invalidRegistrants.length > 0) {
      return NextResponse.json({ 
        error: "Some registrants do not belong to the same event as the team" 
      }, { status: 400 });
    }

    // Update registrants to assign them to the team
    const { error: updateError } = await supabase
      .from("registrants")
      .update({
        event_team_id: teamId,
        updated_at: new Date().toISOString(),
      })
      .in("id", registrant_ids);

    if (updateError) {
      console.error("Team assignment error:", updateError);
      return NextResponse.json({ error: "Failed to assign registrants to team" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully assigned ${registrant_ids.length} registrants to team` 
    });
  } catch (error) {
    console.error("Team assignment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await context.params;
    const { searchParams } = new URL(request.url);
    const registrantId = searchParams.get("registrant_id");
    
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!registrantId) {
      return NextResponse.json({ error: "Registrant ID is required" }, { status: 400 });
    }

    // Remove registrant from team
    const { error: updateError } = await supabase
      .from("registrants")
      .update({
        event_team_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrantId)
      .eq("event_team_id", teamId);

    if (updateError) {
      console.error("Team removal error:", updateError);
      return NextResponse.json({ error: "Failed to remove registrant from team" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team removal API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
