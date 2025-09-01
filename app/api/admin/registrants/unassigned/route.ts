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
      .from("users")
      .select("role, region")
      .eq("id", user.id)
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
    const diocese = searchParams.get("diocese") || "";
    const roleId = searchParams.get("role_id") || "";

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
        notes,
        event_roles:event_role_id(
          id,
          name,
          description
        ),
        registration:registrations!inner(
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
      .in("registration.status", ["confirmed", "temp_confirmed"])
      .order("created_at", { ascending: false });

    // Apply filters
    if (search) {
      // Smart detection: if search contains any digit, search by invoice code, otherwise by name
      const isInvoiceSearch = /\d/.test(search);
      if (isInvoiceSearch) {
        query = query.ilike("registration.invoice_code", `%${search}%`);
      } else {
        query = query.ilike("full_name", `%${search}%`);
      }
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
    if (diocese) {
      query = query.ilike("diocese", `%${diocese}%`);
    }
    if (roleId) {
      query = query.eq("event_role_id", roleId);
    }

    // Regional admin can only see registrants from their region
    if (profile.role === "regional_admin" && profile.region) {
      query = query.eq("registration.user.region", profile.region);
    }

    // Build count query with same filters for accurate pagination
    let countQuery = supabase
      .from("registrants")
      .select("id, registration:registrations!inner(status, invoice_code, users!registrations_user_id_fkey(region))", { count: "exact", head: true })
      .is("event_team_id", null)
      .eq("registration.status", "confirmed");

    // Apply same filters to count query
    if (search) {
      const isInvoiceSearch = /\d/.test(search);
      if (isInvoiceSearch) {
        countQuery = countQuery.ilike("registration.invoice_code", `%${search}%`);
      } else {
        countQuery = countQuery.ilike("full_name", `%${search}%`);
      }
    }
    if (gender) {
      countQuery = countQuery.eq("gender", gender);
    }
    if (ageGroup) {
      countQuery = countQuery.eq("age_group", ageGroup);
    }
    if (province) {
      countQuery = countQuery.ilike("province", `%${province}%`);
    }
    if (diocese) {
      countQuery = countQuery.ilike("diocese", `%${diocese}%`);
    }
    if (roleId) {
      countQuery = countQuery.eq("event_role_id", roleId);
    }
    if (profile.role === "regional_admin" && profile.region) {
      countQuery = countQuery.eq("registration.user.region", profile.region);
    }

    const { count } = await countQuery;

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
