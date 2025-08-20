import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/auth';
import { createTeamMembersWorkbook, generateTeamExportFilename, type TeamMemberForExport } from '@/lib/excel-export';
import * as XLSX from 'xlsx';

// Interface for Supabase query result
interface SupabaseMember {
  id: string;
  full_name: string;
  gender: string;
  age_group: string;
  province: string;
  diocese?: string;
  email?: string;
  phone?: string;
  facebook_link?: string;
  registration?: {
    id: string;
    invoice_code: string;
    status: string;
    created_at: string;
  } | null;
  event_role?: {
    id: string;
    name: string;
  } | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check user permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["registration_manager", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: teamId } = await params;

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from("event_teams")
      .select("id, name, description")
      .eq("id", teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get team members with all required information
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
        registration:registrations!registrants_registration_id_fkey(
          id,
          invoice_code,
          status,
          created_at
        ),
        event_role:event_roles!registrants_event_role_id_fkey(
          id,
          name
        )
      `)
      .eq("event_team_id", teamId)
      .order("created_at");

    if (membersError) {
      console.error("Members query error:", membersError);
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
    }

    // Transform data for export
    const membersForExport: TeamMemberForExport[] = (members || []).map((member) => {
      const typedMember = member as unknown as SupabaseMember;
      const registration = typedMember.registration;

      return {
        id: typedMember.id,
        full_name: typedMember.full_name,
        gender: typedMember.gender,
        age_group: typedMember.age_group,
        province: typedMember.province,
        diocese: typedMember.diocese,
        email: typedMember.email,
        phone: typedMember.phone,
        facebook_link: typedMember.facebook_link,
        event_role_name: typedMember.event_role?.name,
        registration_status: registration?.status,
        invoice_code: registration?.invoice_code,
        joined_date: registration?.created_at
      };
    });

    if (membersForExport.length === 0) {
      return NextResponse.json({ error: "Đội chưa có thành viên nào" }, { status: 400 });
    }

    // Create Excel workbook
    const workbook = createTeamMembersWorkbook(team.name, membersForExport);
    
    // Generate filename
    const filename = generateTeamExportFilename(team.name);
    
    // Convert workbook to buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error exporting team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
