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

    // Get template roles from an existing event instead of hardcoding
    // Find the first event that has roles to use as template
    const { data: templateRoles, error: rolesError } = await supabase
      .from("event_roles")
      .select("name, description, team_name, event_config_id")
      .order("created_at", { ascending: true })

    if (rolesError) {
      console.error("Error fetching template roles:", rolesError);
      return NextResponse.json({ error: "Failed to fetch template roles" }, { status: 500 });
    }

    if (!templateRoles || templateRoles.length === 0) {
      return NextResponse.json({
        error: "No template roles found. Please ensure at least one event has roles configured."
      }, { status: 404 });
    }

    // Use the first event's roles as template
    const templateEventId = templateRoles[0].event_config_id;
    const roles = templateRoles.filter(role => role.event_config_id === templateEventId);

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
        description: role.description,
        team_name: role.team_name
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
