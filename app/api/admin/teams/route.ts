import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventConfigId = searchParams.get("event_config_id");
    
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

    // Get teams with leader and sub-leader information
    let query = supabase
      .from("event_teams")
      .select(`
        *,
        leader:users!event_teams_leader_id_fkey(id, full_name, email),
        sub_leader:users!event_teams_sub_leader_id_fkey(id, full_name, email),
        event_config:event_configs!event_teams_event_config_id_fkey(name, is_active)
      `)
      .order("name");

    if (eventConfigId) {
      query = query.eq("event_config_id", eventConfigId);
    }

    const { data: teams, error } = await query;

    if (error) {
      console.error("Teams query error:", error);
      return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
    }

    // Get team member counts
    const teamsWithCounts = await Promise.all(
      (teams || []).map(async (team) => {
        const { count } = await supabase
          .from("registrants")
          .select("*", { count: "exact", head: true })
          .eq("event_team_id", team.id);

        return {
          ...team,
          member_count: count || 0,
        };
      })
    );

    return NextResponse.json({ teams: teamsWithCounts });
  } catch (error) {
    console.error("Teams API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const { name, description, event_config_id, leader_id, sub_leader_id } = await request.json();

    if (!name || !event_config_id) {
      return NextResponse.json({ error: "Team name and event config are required" }, { status: 400 });
    }

    // Check if team name already exists for this event
    const { data: existingTeam } = await supabase
      .from("event_teams")
      .select("id")
      .eq("event_config_id", event_config_id)
      .eq("name", name)
      .single();

    if (existingTeam) {
      return NextResponse.json({ error: "Team name already exists for this event" }, { status: 400 });
    }

    // Create new team
    const { data: team, error } = await supabase
      .from("event_teams")
      .insert({
        name,
        description,
        event_config_id,
        leader_id,
        sub_leader_id,
      })
      .select(`
        *,
        leader:users!event_teams_leader_id_fkey(id, full_name, email),
        sub_leader:users!event_teams_sub_leader_id_fkey(id, full_name, email),
        event_config:event_configs!event_teams_event_config_id_fkey(name, is_active)
      `)
      .single();

    if (error) {
      console.error("Team creation error:", error);
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }

    return NextResponse.json({ team: { ...team, member_count: 0 } });
  } catch (error) {
    console.error("Team creation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
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

    const { id, name, description, leader_id, sub_leader_id } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: "Team ID and name are required" }, { status: 400 });
    }

    // Update team
    const { data: team, error } = await supabase
      .from("event_teams")
      .update({
        name,
        description,
        leader_id,
        sub_leader_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        leader:users!event_teams_leader_id_fkey(id, full_name, email),
        sub_leader:users!event_teams_sub_leader_id_fkey(id, full_name, email),
        event_config:event_configs!event_teams_event_config_id_fkey(name, is_active)
      `)
      .single();

    if (error) {
      console.error("Team update error:", error);
      return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
    }

    // Get member count
    const { count } = await supabase
      .from("registrants")
      .select("*", { count: "exact", head: true })
      .eq("event_team_id", team.id);

    return NextResponse.json({ team: { ...team, member_count: count || 0 } });
  } catch (error) {
    console.error("Team update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("id");
    
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

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Check if team has members
    const { count } = await supabase
      .from("registrants")
      .select("*", { count: "exact", head: true })
      .eq("event_team_id", teamId);

    if (count && count > 0) {
      return NextResponse.json({ 
        error: "Cannot delete team with existing members. Please reassign members first." 
      }, { status: 400 });
    }

    // Delete team
    const { error } = await supabase
      .from("event_teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      console.error("Team deletion error:", error);
      return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team deletion API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
