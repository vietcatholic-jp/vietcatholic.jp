import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

    if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get users based on role permissions
    let usersQuery = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    // Regional admins can only see users in their region
    if (profile.role === "regional_admin") {
      usersQuery = usersQuery.eq("region", profile.region);
    }

    const { data: users, error: usersError } = await usersQuery;
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });

  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, role, region } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check permissions for role assignment
    const assignableRoles = profile.role === 'super_admin' 
      ? ['participant', 'event_organizer', 'group_leader', 'regional_admin', 'super_admin']
      : ['participant', 'event_organizer', 'group_leader'];

    if (!assignableRoles.includes(role)) {
      return NextResponse.json({ error: "Cannot assign this role" }, { status: 403 });
    }

    // Check region permissions
    if (profile.role === "regional_admin" && region !== profile.region) {
      return NextResponse.json({ error: "Cannot assign users to other regions" }, { status: 403 });
    }

    // Update user
    const { error: updateError } = await supabase
      .from("users")
      .update({ 
        role,
        region: region || null,
        updated_at: new Date().toISOString() 
      })
      .eq("id", userId);

    if (updateError) {
      console.error("User update error:", updateError);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "User updated successfully" 
    });

  } catch (error) {
    console.error("Users update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
