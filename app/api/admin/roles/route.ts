import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventConfigId = searchParams.get("event_config_id");
    const includeStats = searchParams.get("include_stats") === "true";
    
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get roles with optional team information
    let query = supabase
      .from("event_roles")
      .select(`
        *,
        event_config:event_configs!event_roles_event_config_id_fkey(name, is_active)
      `)
      .order("name");

    if (eventConfigId) {
      query = query.eq("event_config_id", eventConfigId);
    }

    const { data: roles, error } = await query;

    if (error) {
      console.error("Roles query error:", error);
      return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }

    // Get role statistics if requested
    let rolesWithStats = roles || [];
    if (includeStats) {
      rolesWithStats = await Promise.all(
        (roles || []).map(async (role) => {
          const { count: totalCount } = await supabase
            .from("registrants")
            .select("*", { count: "exact", head: true })
            .eq("event_role_id", role.id);

          const { count: confirmedCount } = await supabase
            .from("registrants")
            .select("*", { count: "exact", head: true })
            .eq("event_role_id", role.id)
            .eq("registrations.status", "confirmed");

          return {
            ...role,
            total_count: totalCount || 0,
            confirmed_count: confirmedCount || 0,
          };
        })
      );
    }

    return NextResponse.json({ roles: rolesWithStats });
  } catch (error) {
    console.error("Roles API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, event_config_id, permissions } = await request.json();

    if (!name || !event_config_id) {
      return NextResponse.json({ error: "Role name and event config are required" }, { status: 400 });
    }

    // Check if role name already exists for this event
    const { data: existingRole } = await supabase
      .from("event_roles")
      .select("id")
      .eq("event_config_id", event_config_id)
      .eq("name", name)
      .single();

    if (existingRole) {
      return NextResponse.json({ error: "Role name already exists for this event" }, { status: 400 });
    }

    // Create new role
    const { data: role, error } = await supabase
      .from("event_roles")
      .insert({
        name,
        description,
        event_config_id,
        permissions,
      })
      .select(`
        *,
        event_config:event_configs!event_roles_event_config_id_fkey(name, is_active)
      `)
      .single();

    if (error) {
      console.error("Role creation error:", error);
      return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }

    return NextResponse.json({ role: { ...role, total_count: 0, confirmed_count: 0 } });
  } catch (error) {
    console.error("Role creation API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, name, description, permissions } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: "Role ID and name are required" }, { status: 400 });
    }

    // Update role
    const { data: role, error } = await supabase
      .from("event_roles")
      .update({
        name,
        description,
        permissions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        event_config:event_configs!event_roles_event_config_id_fkey(name, is_active)
      `)
      .single();

    if (error) {
      console.error("Role update error:", error);
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }

    // Get role statistics
    const { count: totalCount } = await supabase
      .from("registrants")
      .select("*", { count: "exact", head: true })
      .eq("event_role_id", role.id);

    const { count: confirmedCount } = await supabase
      .from("registrants")
      .select("*", { count: "exact", head: true })
      .eq("event_role_id", role.id)
      .eq("registrations.status", "confirmed");

    return NextResponse.json({ 
      role: { 
        ...role, 
        total_count: totalCount || 0, 
        confirmed_count: confirmedCount || 0 
      } 
    });
  } catch (error) {
    console.error("Role update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("id");
    
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    // Check if role has registrants
    const { count } = await supabase
      .from("registrants")
      .select("*", { count: "exact", head: true })
      .eq("event_role_id", roleId);

    if (count && count > 0) {
      return NextResponse.json({ 
        error: "Cannot delete role with existing registrants. Please reassign registrants first." 
      }, { status: 400 });
    }

    // Delete role
    const { error } = await supabase
      .from("event_roles")
      .delete()
      .eq("id", roleId);

    if (error) {
      console.error("Role deletion error:", error);
      return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Role deletion API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
