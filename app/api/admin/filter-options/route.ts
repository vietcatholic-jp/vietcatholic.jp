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
      .select("role, region")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "registration_manager", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get unique provinces from registrants
    const { data: provinces } = await supabase
      .from("registrants")
      .select("province")
      .not("province", "is", null)
      .not("province", "eq", "");

    // Get unique dioceses from registrants
    const { data: dioceses } = await supabase
      .from("registrants")
      .select("diocese")
      .not("diocese", "is", null)
      .not("diocese", "eq", "");

    // Get event roles
    const { data: roles } = await supabase
      .from("event_roles")
      .select("id, name, description")
      .order("name");

    // Process unique values
    const uniqueProvinces = [...new Set(provinces?.map(p => p.province) || [])]
      .filter(Boolean)
      .sort();

    const uniqueDioceses = [...new Set(dioceses?.map(d => d.diocese) || [])]
      .filter(Boolean)
      .sort();

    return NextResponse.json({
      provinces: uniqueProvinces.map(province => ({ value: province, label: province })),
      dioceses: uniqueDioceses.map(diocese => ({ value: diocese, label: diocese })),
      roles: roles?.map(role => ({ value: role.id, label: role.name, description: role.description })) || []
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
