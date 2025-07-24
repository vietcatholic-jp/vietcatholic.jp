import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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
      .select("role, region")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["event_organizer", "registration_manager", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const gender = searchParams.get("gender") || "";
    const ageGroup = searchParams.get("age_group") || "";
    const province = searchParams.get("province") || "";

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
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
        registration:registrations!registrants_registration_id_fkey(
          id,
          invoice_code,
          status,
          user:users!registrations_user_id_fkey(
            full_name,
            email,
            region
          )
        )
      `)
      .is("event_team_id", null)
      .order("created_at", { ascending: false });

    // Apply filters
    if (search) {
      query = query.ilike("full_name", `%${search}%`);
    }
    if (gender) {
      query = query.eq("gender", gender);
    }
    if (ageGroup) {
      query = query.eq("age_group", ageGroup);
    }
    if (province) {
      query = query.ilike("province", `%${province}%`);
    }

    // Regional admin can only see registrants from their region
    if (profile.role === "regional_admin" && profile.region) {
      query = query.eq("registration.user.region", profile.region);
    }

    // Get total count for pagination
    const { count } = await supabase
      .from("registrants")
      .select("*", { count: "exact", head: true })
      .is("event_team_id", null);

    // Get paginated results
    const { data: registrants, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to fetch registrants" }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data: registrants || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
