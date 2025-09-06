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
  shirt_size?: string;
  province: string;
  diocese?: string;
  email?: string;
  phone?: string;
  facebook_link?: string;
  second_day_only?: boolean;
  selected_attendance_day?: string;
  team_name?: string;
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
  event_team?: {
    name: string;
  } | null;
}

export async function GET(
  request: NextRequest
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

    if (!profile || !["registration_manager", "super_admin","cashier_role"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Extract status from query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    if (!status) {
      return NextResponse.json({ error: 'Status parameter is required' }, { status: 400 });
    }

    // Get team members with all required information
    const { data: members, error: membersError } = await supabase
      .from("registrants")
      .select(`
        id,
        full_name,
        gender,
        age_group,
        shirt_size,
        province,
        diocese,
        email,
        phone,
        facebook_link,
        selected_attendance_day,
        second_day_only,
        registration:registrations(
          id,
          invoice_code,
          status,
          created_at
        ),
        event_role:event_roles!registrants_event_role_id_fkey(
          id,
          name
        ),
        event_team:event_teams!registrants_event_team_id_fkey(name)
      `)
      .order("full_name", { ascending: true })
      .order("created_at", { ascending: true });

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
        shirt_size: typedMember.shirt_size,
        province: typedMember.province,
        diocese: typedMember.diocese,
        email: typedMember.email,
        phone: typedMember.phone,
        facebook_link: typedMember.facebook_link,
        event_role_name: typedMember.event_role?.name,
        selected_attendance_day: typedMember.selected_attendance_day,
        second_day_only: typedMember.second_day_only,
        registration_status: registration?.status,
        invoice_code: registration?.invoice_code,
        joined_date: registration?.created_at,
        event_team_name: typedMember.event_team?.name
      };
    });

    // Sort by team name, then by invoice code, then by name
    membersForExport.sort((a, b) => {
      // First sort by team name
      const teamA = a.event_team_name || '';
      const teamB = b.event_team_name || '';
      if (teamA !== teamB) {
        return teamA.localeCompare(teamB);
      }
      
      // Then by invoice code
      const invoiceA = a.invoice_code || '';
      const invoiceB = b.invoice_code || '';
      if (invoiceA !== invoiceB) {
        return invoiceA.localeCompare(invoiceB);
      }
      
      // Finally by name
      return a.full_name.localeCompare(b.full_name);
    });

    if (membersForExport.length === 0) {
      return NextResponse.json({ error: "Đội chưa có thành viên nào" }, { status: 400 });
    }

    // Create Excel workbook
    const workbook = createTeamMembersWorkbook(membersForExport, status);
    
    // Generate filename
    const filename = generateTeamExportFilename(status);
    
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
