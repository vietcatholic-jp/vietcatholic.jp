import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateTransportationGroupSchema = z.object({
  name: z.string().min(1, "Tên nhóm là bắt buộc"),
  departure_location: z.string().min(1, "Điểm khởi hành là bắt buộc"),
  departure_time: z.string().min(1, "Thời gian khởi hành là bắt buộc"),
  arrival_location: z.string().optional(),
  capacity: z.number().min(1, "Sức chứa phải lớn hơn 0"),
  vehicle_type: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role, region")
      .eq("id", user.id)
      .single();

    if (!profile || !["regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get transportation groups
    let query = supabase
      .from("transportation_groups")
      .select(`
        *,
        creator:users!created_by(full_name, email),
        registrations:transportation_registrations(
          id,
          registrant:registrants(
            id,
            full_name,
            province,
            diocese
          )
        )
      `)
      .order("created_at", { ascending: false });

    // Filter by region for regional admins
    if (profile.role === "regional_admin" && profile.region) {
      query = query.eq("region", profile.region);
    }

    const { data: transportationGroups, error } = await query;

    if (error) {
      console.error("Transportation groups query error:", error);
      return NextResponse.json({ error: "Failed to fetch transportation groups" }, { status: 500 });
    }

    return NextResponse.json(transportationGroups);

  } catch (error) {
    console.error("Transportation groups API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role, region")
      .eq("id", user.id)
      .single();

    if (!profile || !["regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = CreateTransportationGroupSchema.parse(body);

    // Create transportation group
    const { data: transportationGroup, error } = await supabase
      .from("transportation_groups")
      .insert({
        ...validatedData,
        region: profile.region, // Use user's region
        created_by: user.id,
        departure_time: new Date(validatedData.departure_time).toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Create transportation group error:", error);
      return NextResponse.json({ error: "Failed to create transportation group" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      transportationGroup 
    });

  } catch (error) {
    console.error("Create transportation group API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
