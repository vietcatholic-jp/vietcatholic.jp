import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check super admin role
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden - Super admin required" }, { status: 403 });
    }

    // Get all event configs
    const { data: events, error: eventsError } = await supabase
      .from("event_configs")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ error: "No events found" }, { status: 404 });
    }

    const results = [];

    // Define all roles
    const roles = [
      // Media team roles
      { name: 'Trưởng ban Truyền thông', description: 'Chịu trách nhiệm điều phối toàn bộ hoạt động truyền thông của sự kiện' },
      { name: 'Phó ban Truyền thông', description: 'Hỗ trợ trưởng ban trong việc quản lý các hoạt động truyền thông' },
      { name: 'Thành viên ban Truyền thông', description: 'Thực hiện các công việc truyền thông như chụp ảnh, quay video, đăng bài' },
      
      // Activity team roles
      { name: 'Trưởng ban Sinh hoạt', description: 'Chịu trách nhiệm tổ chức và điều phối các hoạt động sinh hoạt' },
      { name: 'Phó ban Sinh hoạt', description: 'Hỗ trợ trưởng ban trong việc tổ chức các hoạt động sinh hoạt' },
      { name: 'Thành viên ban Sinh hoạt', description: 'Thực hiện các hoạt động sinh hoạt, trò chơi, văn nghệ' },
      
      // Discipline team roles
      { name: 'Trưởng ban Kỷ luật', description: 'Chịu trách nhiệm duy trì trật tự và kỷ luật trong sự kiện' },
      { name: 'Phó ban Kỷ luật', description: 'Hỗ trợ trưởng ban trong việc duy trì trật tự' },
      { name: 'Thành viên ban Kỷ luật', description: 'Thực hiện nhiệm vụ giữ gìn trật tự, hướng dẫn người tham gia' },
      
      // Logistics team roles
      { name: 'Trưởng ban Hậu cần', description: 'Chịu trách nhiệm tổ chức và quản lý các hoạt động hậu cần' },
      { name: 'Phó ban Hậu cần', description: 'Hỗ trợ trưởng ban trong việc quản lý hậu cần' },
      { name: 'Thành viên ban Hậu cần', description: 'Thực hiện các công việc hậu cần như vận chuyển, chuẩn bị vật dụng' },
      
      // Liturgy team roles
      { name: 'Trưởng ban Phụng vụ', description: 'Chịu trách nhiệm tổ chức và điều phối các hoạt động phụng vụ' },
      { name: 'Phó ban Phụng vụ', description: 'Hỗ trợ trưởng ban trong việc tổ chức phụng vụ' },
      { name: 'Thành viên ban Phụng vụ', description: 'Thực hiện các nhiệm vụ phụng vụ như ca đoàn, đọc sách, rước lễ' },
      
      // Security team roles
      { name: 'Trưởng ban An ninh', description: 'Chịu trách nhiệm đảm bảo an toàn và an ninh cho sự kiện' },
      { name: 'Phó ban An ninh', description: 'Hỗ trợ trưởng ban trong việc đảm bảo an ninh' },
      { name: 'Thành viên ban An ninh', description: 'Thực hiện nhiệm vụ bảo vệ, kiểm soát ra vào' },
      
      // Registration team roles
      { name: 'Trưởng ban Thư ký', description: 'Chịu trách nhiệm quản lý đăng ký và thông tin người tham gia' },
      { name: 'Phó ban Thư ký', description: 'Hỗ trợ trưởng ban trong việc quản lý đăng ký' },
      { name: 'Thành viên ban Thư ký', description: 'Thực hiện các công việc đăng ký, check-in, quản lý thông tin' },
      
      // Catering team roles
      { name: 'Trưởng ban Ẩm thực', description: 'Chịu trách nhiệm tổ chức và quản lý các hoạt động ẩm thực' },
      { name: 'Phó ban Ẩm thực', description: 'Hỗ trợ trưởng ban trong việc quản lý ẩm thực' },
      { name: 'Thành viên ban Ẩm thực', description: 'Thực hiện các công việc nấu ăn, phục vụ, dọn dẹp' },
      
      // Health team roles
      { name: 'Trưởng ban Y tế', description: 'Chịu trách nhiệm chăm sóc sức khỏe người tham gia' },
      { name: 'Phó ban Y tế', description: 'Hỗ trợ trưởng ban trong việc chăm sóc y tế' },
      { name: 'Thành viên ban Y tế', description: 'Thực hiện các công việc sơ cứu, chăm sóc sức khỏe' },
      
      // Audio Light team roles
      { name: 'Trưởng ban Âm thanh Ánh sáng', description: 'Chịu trách nhiệm quản lý hệ thống âm thanh và ánh sáng' },
      { name: 'Phó ban Âm thanh Ánh sáng', description: 'Hỗ trợ trưởng ban trong việc quản lý âm thanh ánh sáng' },
      { name: 'Thành viên ban Âm thanh Ánh sáng', description: 'Thực hiện các công việc kỹ thuật âm thanh và ánh sáng' },
      
      // Group leadership roles
      { name: 'Trưởng nhóm các đội', description: 'Chịu trách nhiệm điều phối hoạt động giữa các đội' },
      { name: 'Phó trưởng nhóm các đội', description: 'Hỗ trợ trưởng nhóm trong việc điều phối' },
      
      // Organizer roles
      { name: 'Ban tổ chức cốt cán', description: 'Thành viên ban tổ chức cốt cán, thủ quỹ' },
      { name: 'Ban tổ chức khu vực', description: 'Thành viên ban tổ chức khu vực' }
    ];

    // Process each event
    for (const event of events) {
      // Check if roles already exist for this event
      const { data: existingRoles } = await supabase
        .from("event_roles")
        .select("id")
        .eq("event_config_id", event.id)
        .limit(1);

      if (existingRoles && existingRoles.length > 0) {
        results.push({
          eventId: event.id,
          eventName: event.name,
          status: "skipped",
          message: "Roles already exist"
        });
        continue;
      }

      // Insert roles for this event
      const rolesToInsert = roles.map(role => ({
        event_config_id: event.id,
        name: role.name,
        description: role.description
      }));

      const { data: insertedRoles, error: insertError } = await supabase
        .from("event_roles")
        .insert(rolesToInsert)
        .select("id");

      if (insertError) {
        console.error(`Error inserting roles for event ${event.id}:`, insertError);
        results.push({
          eventId: event.id,
          eventName: event.name,
          status: "error",
          message: insertError.message
        });
      } else {
        results.push({
          eventId: event.id,
          eventName: event.name,
          status: "success",
          message: `Inserted ${insertedRoles?.length || 0} roles`
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Role population completed",
      results
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
