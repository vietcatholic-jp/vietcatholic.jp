import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { TeamOverview } from "@/components/my-team/team-overview";
import { MemberList } from "@/components/my-team/member-list";
import { TeamDownloads } from "@/components/my-team/team-downloads";
import TeamManagementErrorBoundary, { TeamOverviewErrorFallback, MemberListErrorFallback } from "@/components/my-team/error-boundary";
import { TeamMember } from "@/lib/types/team-management";

interface MyTeamData {
  team_info: {
    id: string;
    name: string;
    description?: string;
    capacity: number;
    member_count: number;
    leader?: {
      id: string;
      full_name: string;
      email: string;
    } | null;
    sub_leader?: {
      id: string;
      full_name: string;
      email: string;
    } | null;
    event_config?: {
      name: string;
      is_active: boolean;
    } | null;
    user_role: 'leader' | 'sub_leader';
  };
  statistics: {
    total_members: number;
    gender: {
      male: number;
      female: number;
    };
    age_groups: {
      under_18: number;
      '18_25': number;
      '26_35': number;
      '36_50': number;
      over_50: number;
    };
    registration_status: {
      checked_in: number;
    };
  };
  members: unknown[];
}

async function getMyTeamData(userId: string): Promise<MyTeamData | null> {
  try {
    const supabase = await createClient();

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
      .or(`leader_id.eq.${userId},sub_leader_id.eq.${userId}`);

    if (teamsError || !teams || teams.length === 0) {
      return null; // User not assigned to any team
    }

    // For now, return the first team (assuming user is only leader/sub-leader of one team)
    const team = teams[0];

    // Get team members (registrants assigned to this team)
    const { data: members, error: membersError } = await supabase
      .from("registrants")
      .select(`
        id,
        saint_name,
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
        selected_attendance_day,
        second_day_only,
        is_checked_in,
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
      .order("created_at");

    if (membersError) {
      console.error("Members query error:", membersError);
      return null;
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
      checked_in: members?.filter(m => m.is_checked_in).length || 0,
    };

    return {
      team_info: {
        id: team.id,
        name: team.name,
        description: team.description,
        capacity: team.capacity,
        member_count: totalMembers,
        leader: Array.isArray(team.leader) ? team.leader[0] as { id: string; full_name: string; email: string } | null : team.leader as { id: string; full_name: string; email: string } | null,
        sub_leader: Array.isArray(team.sub_leader) ? team.sub_leader[0] as { id: string; full_name: string; email: string } | null : team.sub_leader as { id: string; full_name: string; email: string } | null,
        event_config: Array.isArray(team.event_config) ? team.event_config[0] as { name: string; is_active: boolean } | null : team.event_config as { name: string; is_active: boolean } | null,
        user_role: userId === team.leader_id ? 'leader' : 'sub_leader'
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
      members: (members || []) as unknown[]
    };
  } catch (error) {
    console.error('Error fetching team data:', error);
    return null;
  }
}

export default async function MyTeamPage() {
  const user = await getServerUser();
  
  if (!user) {
    redirect('/auth/login?redirectTo=/my-team');
  }

  const supabase = await createClient();
  
  // Get user profile to check role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const teamData = await getMyTeamData(user.id);

  // Check if user can edit (registration_staff and sub_leader)
  const canEdit = userProfile?.role === 'registration_staff' || userProfile?.role === 'registration_manager' || userProfile?.role === 'super_admin';
  if (!teamData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại Dashboard
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Nhóm của tôi</h1>
            <p className="text-muted-foreground mt-2">
              Quản lý thông tin và thành viên nhóm
            </p>
          </div>

          {/* No Team Assigned */}
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Chưa được phân công nhóm</h3>
              <p className="text-muted-foreground mb-6">
                Bạn chưa được phân công quản lý nhóm nào. Vui lòng liên hệ ban tổ chức để được hỗ trợ.
              </p>
              <Link href="/dashboard">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { team_info, statistics } = teamData;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Dashboard
            </Button>
          </Link>
        </div>

        {/* Team Overview Component */}
        <TeamManagementErrorBoundary fallback={TeamOverviewErrorFallback}>
          <TeamOverview teamInfo={team_info} statistics={statistics} />
        </TeamManagementErrorBoundary>

        {/* Member List Component */}
        <div className="mt-8">
          <TeamManagementErrorBoundary fallback={MemberListErrorFallback}>
            <MemberList 
              members={teamData.members} 
              totalMembers={statistics.total_members}
              canEdit={canEdit}
              teamName={team_info.name}
            />
          </TeamManagementErrorBoundary>
        </div>
        {/* Team Downloads Component */}
        <div className="mt-8">
          <TeamManagementErrorBoundary fallback={TeamOverviewErrorFallback}>
            <TeamDownloads 
              members={teamData.members as TeamMember[]} 
              teamName={team_info.name}
            />
          </TeamManagementErrorBoundary>
        </div>
      </div>
    </div>
  );
}
