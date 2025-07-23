import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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

    // Get request parameters
    const body = await request.json();
    const { format = "csv", team_ids = [] } = body;

    // Build query for teams and their members
    let query = supabase
      .from("event_teams")
      .select(`
        id,
        name,
        description,
        capacity,
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
            status
          )
        )
      `)
      .order("name");

    // Filter by specific teams if provided
    if (team_ids.length > 0) {
      query = query.in("id", team_ids);
    }

    const { data: teams, error: teamsError } = await query;

    if (teamsError) {
      console.error("Export teams error:", teamsError);
      return NextResponse.json({ error: "Failed to fetch teams data" }, { status: 500 });
    }

    // Prepare export data
    const exportData: any[] = [];
    
    (teams || []).forEach(team => {
      if (team.registrants && team.registrants.length > 0) {
        team.registrants.forEach((registrant: any) => {
          exportData.push({
            team_name: team.name,
            team_description: team.description || "",
            team_capacity: team.capacity || "",
            registrant_name: registrant.full_name,
            gender: registrant.gender === "male" ? "Nam" : "Nữ",
            age_group: formatAgeGroup(registrant.age_group),
            province: registrant.province,
            diocese: registrant.diocese || "",
            email: registrant.email || "",
            phone: registrant.phone || "",
            invoice_code: registrant.registration?.invoice_code || "",
            registration_status: registrant.registration?.status || ""
          });
        });
      } else {
        // Include empty teams
        exportData.push({
          team_name: team.name,
          team_description: team.description || "",
          team_capacity: team.capacity || "",
          registrant_name: "",
          gender: "",
          age_group: "",
          province: "",
          diocese: "",
          email: "",
          phone: "",
          invoice_code: "",
          registration_status: ""
        });
      }
    });

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Tên đội",
        "Mô tả đội", 
        "Sức chứa",
        "Tên thành viên",
        "Giới tính",
        "Độ tuổi",
        "Tỉnh/Thành phố",
        "Giáo phận",
        "Email",
        "Số điện thoại",
        "Mã đăng ký",
        "Trạng thái đăng ký"
      ];

      const csvContent = [
        headers.join(","),
        ...exportData.map(row => [
          `"${row.team_name}"`,
          `"${row.team_description}"`,
          `"${row.team_capacity}"`,
          `"${row.registrant_name}"`,
          `"${row.gender}"`,
          `"${row.age_group}"`,
          `"${row.province}"`,
          `"${row.diocese}"`,
          `"${row.email}"`,
          `"${row.phone}"`,
          `"${row.invoice_code}"`,
          `"${row.registration_status}"`
        ].join(","))
      ].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="teams-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    return NextResponse.json({
      data: exportData,
      summary: {
        total_teams: teams?.length || 0,
        total_members: exportData.filter(row => row.registrant_name).length,
        export_date: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatAgeGroup(ageGroup: string): string {
  const ageGroupMap: Record<string, string> = {
    'under_12': 'Dưới 12 tuổi',
    '12_17': '12-17 tuổi',
    '18_25': '18-25 tuổi',
    '26_35': '26-35 tuổi',
    '36_50': '36-50 tuổi',
    'over_50': 'Trên 50 tuổi',
  };
  return ageGroupMap[ageGroup] || ageGroup;
}
