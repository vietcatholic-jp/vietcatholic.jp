import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "registration_manager", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get total teams count
    const { count: totalTeams, error: teamsError } = await supabase
      .from("event_teams")
      .select("*", { count: "exact", head: true });

    if (teamsError) {
      console.error("Teams count error:", teamsError);
      return NextResponse.json({ error: "Failed to get teams count" }, { status: 500 });
    }

    // Get assigned registrants count
    const { count: totalAssigned, error: assignedError } = await supabase
      .from("registrants")
      .select("*", { count: "exact", head: true })
      .not("event_team_id", "is", null);

    if (assignedError) {
      console.error("Assigned count error:", assignedError);
      return NextResponse.json({ error: "Failed to get assigned count" }, { status: 500 });
    }

    // Get unassigned registrants count
    const { count: totalUnassigned, error: unassignedError } = await supabase
      .from("registrants")
      .select("id, registrations!inner(status)", { count: "exact", head: true })
      .is("event_team_id", null)
      .eq("registrations.status", "confirmed");

    if (unassignedError) {
      console.error("Unassigned count error:", unassignedError);
      return NextResponse.json({ error: "Failed to get unassigned count" }, { status: 500 });
    }

    // Get team distribution
    const { data: teamDistributionData, error: teamDistError } = await supabase
      .from("event_teams")
      .select(`
        id,
        name,
        registrants:registrants!registrants_event_team_id_fkey(id)
      `);

    if (teamDistError) {
      console.error("Team distribution error:", teamDistError);
      return NextResponse.json({ error: "Failed to get team distribution" }, { status: 500 });
    }

    const teamDistribution = (teamDistributionData || [])
      .map(team => ({
        team_name: team.name,
        count: team.registrants?.length || 0
      }))
      .sort((a, b) => b.count - a.count);

    // Get gender distribution for assigned registrants
    const { data: genderData, error: genderError } = await supabase
      .from("registrants")
      .select("gender")
      .not("event_team_id", "is", null);

    if (genderError) {
      console.error("Gender distribution error:", genderError);
      return NextResponse.json({ error: "Failed to get gender distribution" }, { status: 500 });
    }

    // Process gender distribution
    const genderCounts = (genderData || []).reduce((acc: Record<string, number>, item) => {
      const gender = item.gender === "male" ? "Nam" : "Nữ";
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    const genderDistribution = Object.entries(genderCounts)
      .map(([gender, count]) => ({ gender, count }))
      .sort((a, b) => b.count - a.count);

    // Get age group distribution for assigned registrants
    const { data: ageData, error: ageError } = await supabase
      .from("registrants")
      .select("age_group")
      .not("event_team_id", "is", null);

    if (ageError) {
      console.error("Age distribution error:", ageError);
      return NextResponse.json({ error: "Failed to get age distribution" }, { status: 500 });
    }

    // Process age distribution
    const ageCounts = (ageData || []).reduce((acc: Record<string, number>, item) => {
      acc[item.age_group] = (acc[item.age_group] || 0) + 1;
      return acc;
    }, {});

    const ageDistribution = Object.entries(ageCounts)
      .map(([age_group, count]) => ({ age_group, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      overview: {
        total_teams: totalTeams || 0,
        total_assigned: totalAssigned || 0,
        total_unassigned: totalUnassigned || 0
      },
      team_distribution: teamDistribution,
      gender_distribution: genderDistribution,
      age_distribution: ageDistribution
    });

  } catch (error) {
    console.error("Team stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
