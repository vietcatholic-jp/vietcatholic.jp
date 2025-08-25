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

    // No need to check role - just check if user is assigned to any team

    // Check if user is leader or sub-leader in any team
    const { data: teams, error: teamsError } = await supabase
      .from("event_teams")
      .select(`
        id,
        name,
        description,
        capacity,
        leader_id,
        sub_leader_id,
        event_config_id,
        created_at,
        updated_at,
        leader:users!event_teams_leader_id_fkey(id, full_name, email),
        sub_leader:users!event_teams_sub_leader_id_fkey(id, full_name, email),
        event_config:event_configs!event_teams_event_config_id_fkey(name, is_active)
      `)
      .or(`leader_id.eq.${user.id},sub_leader_id.eq.${user.id}`);

    if (teamsError) {
      console.error("Teams query error:", teamsError);
      return NextResponse.json({ error: "Không thể tải thông tin nhóm" }, { status: 500 });
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json({ error: "Bạn chưa được phân công quản lý nhóm nào" }, { status: 403 });
    }

    // For now, return the first team (assuming user is only leader/sub-leader of one team)
    const team = teams[0];

    // Get team members (registrants assigned to this team)
    const { data: members, error: membersError } = await supabase
      .from("registrants")
      .select(`
        id,
        full_name,
        gender,
        age_group,
        province,
        diocese,
        email,
        phone,
        facebook_link,
        portrait_url,
        is_primary,
        created_at,
        registration:registrations!registrants_registration_id_fkey(
          id,
          user_id,
          status,
          invoice_code,
          created_at,
          user:users!registrations_user_id_fkey(id, full_name, email)
        ),
        event_role:event_roles!registrants_event_role_id_fkey(id, name, description)
      `)
      .eq("event_team_id", team.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (membersError) {
      console.error("Members query error:", membersError);
      return NextResponse.json({ error: "Không thể tải danh sách thành viên" }, { status: 500 });
    }

    // Calculate statistics
    const totalMembers = members?.length || 0;
    const maleCount = members?.filter(m => m.gender === 'male').length || 0;
    const femaleCount = members?.filter(m => m.gender === 'female').length || 0;
    
    // Age group statistics
    const ageGroups = {
      'under_18': members?.filter(m => m.age_group === 'under_18').length || 0,
      '18_25': members?.filter(m => m.age_group === '18_25').length || 0,
      '26_35': members?.filter(m => m.age_group === '26_35').length || 0,
      '36_50': members?.filter(m => m.age_group === '36_50').length || 0,
      'over_50': members?.filter(m => m.age_group === 'over_50').length || 0,
    };

    // Registration status statistics
    const statusStats = {
      confirmed: members?.filter(m => m.registration?.[0]?.status === 'confirmed').length || 0,
      pending: members?.filter(m => m.registration?.[0]?.status === 'pending').length || 0,
      report_paid: members?.filter(m => m.registration?.[0]?.status === 'report_paid').length || 0,
      confirm_paid: members?.filter(m => m.registration?.[0]?.status === 'confirm_paid').length || 0,
    };

    // Create response with caching headers
    const response = NextResponse.json({
      team_info: {
        id: team.id,
        name: team.name,
        description: team.description,
        capacity: team.capacity,
        member_count: totalMembers,
        leader: team.leader,
        sub_leader: team.sub_leader,
        event_config: team.event_config,
        user_role: user.id === team.leader_id ? 'leader' : 'sub_leader'
      },
      statistics: {
        total_members: totalMembers,
        gender: {
          male: maleCount,
          female: femaleCount
        },
        age_groups: ageGroups,
        registration_status: statusStats
      },
      members: members || []
    });

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');

    return response;

  } catch (error) {
    console.error("My team API error:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
