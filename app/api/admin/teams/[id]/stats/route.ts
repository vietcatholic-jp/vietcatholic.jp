import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamId = params.id;

    // Get team info with members
    const { data: team, error: teamError } = await supabase
      .from("event_teams")
      .select(`
        id,
        name,
        description,
        capacity,
        leader_id,
        sub_leader_id,
        registrants:registrants!registrants_event_team_id_fkey(
          id,
          full_name,
          gender,
          age_group,
          province,
          diocese,
          email,
          phone,
          registration:registrations!registrants_registration_id_fkey(
            invoice_code,
            status,
            created_at
          )
        )
      `)
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const members = team.registrants || [];

    // Calculate gender distribution
    const genderCounts = members.reduce((acc: Record<string, number>, member) => {
      const gender = member.gender === "male" ? "Nam" : "Nữ";
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    const genderDistribution = Object.entries(genderCounts)
      .map(([gender, count]) => ({ gender, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate age distribution
    const ageCounts = members.reduce((acc: Record<string, number>, member) => {
      acc[member.age_group] = (acc[member.age_group] || 0) + 1;
      return acc;
    }, {});

    const ageDistribution = Object.entries(ageCounts)
      .map(([age_group, count]) => ({ age_group, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate province distribution
    const provinceCounts = members.reduce((acc: Record<string, number>, member) => {
      acc[member.province] = (acc[member.province] || 0) + 1;
      return acc;
    }, {});

    const provinceDistribution = Object.entries(provinceCounts)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate registration status distribution
    const statusCounts = members.reduce((acc: Record<string, number>, member) => {
      const status = member.registration?.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Get leader and sub-leader info if they exist
    let leaderInfo = null;
    let subLeaderInfo = null;

    if (team.leader_id) {
      const { data: leader } = await supabase
        .from("registrants")
        .select("id, full_name, email, phone")
        .eq("id", team.leader_id)
        .single();
      leaderInfo = leader;
    }

    if (team.sub_leader_id) {
      const { data: subLeader } = await supabase
        .from("registrants")
        .select("id, full_name, email, phone")
        .eq("id", team.sub_leader_id)
        .single();
      subLeaderInfo = subLeader;
    }

    return NextResponse.json({
      team_info: {
        id: team.id,
        name: team.name,
        description: team.description,
        capacity: team.capacity,
        member_count: members.length,
        leader: leaderInfo,
        sub_leader: subLeaderInfo
      },
      distributions: {
        gender: genderDistribution,
        age: ageDistribution,
        province: provinceDistribution,
        registration_status: statusDistribution
      },
      members: members.map(member => ({
        id: member.id,
        full_name: member.full_name,
        gender: member.gender,
        age_group: member.age_group,
        province: member.province,
        diocese: member.diocese,
        email: member.email,
        phone: member.phone,
        invoice_code: member.registration?.invoice_code,
        registration_status: member.registration?.status,
        joined_date: member.registration?.created_at
      }))
    });

  } catch (error) {
    console.error("Team stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
