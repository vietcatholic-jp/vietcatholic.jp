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

    // Check if user is super admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all event configurations
    const { data: events, error: eventsError } = await supabase
      .from("event_configs")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });

  } catch (error) {
    console.error("Events API error:", error);
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

    // Check if user is super admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, start_date, end_date, base_price, cancellation_deadline, deadline_payment } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Event name is required" }, { status: 400 });
    }

    // Create new event
    const { data: event, error: createError } = await supabase
      .from("event_configs")
      .insert({
        name,
        description: description || null,
        start_date: start_date || null,
        end_date: end_date || null,
        base_price: base_price || 0,
        cancellation_deadline: cancellation_deadline || end_date,
        deadline_payment: deadline_payment || 10,
        is_active: false
      })
      .select()
      .single();

    if (createError) {
      console.error("Event creation error:", createError);
      return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      event,
      message: "Event created successfully" 
    });

  } catch (error) {
    console.error("Events create API error:", error);
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

    // Check if user is super admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, name, description, start_date, end_date, base_price, cancellation_deadline, deadline_payment } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: "Event ID and name are required" }, { status: 400 });
    }

    // Update event
    const { data: event, error: updateError } = await supabase
      .from("event_configs")
      .update({
        name,
        description: description || null,
        start_date: start_date || null,
        end_date: end_date || null,
        base_price: base_price || 0,
        cancellation_deadline: cancellation_deadline || end_date,
        deadline_payment: deadline_payment || 10,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Event update error:", updateError);
      return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      event,
      message: "Event updated successfully" 
    });

  } catch (error) {
    console.error("Events update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { eventId, isActive } = await request.json();

    if (!eventId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: "Event ID and status are required" }, { status: 400 });
    }

    // Update event status
    const { error: updateError } = await supabase
      .from("event_configs")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq("id", eventId);

    if (updateError) {
      console.error("Event status update error:", updateError);
      return NextResponse.json({ error: "Failed to update event status" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Event status updated successfully" 
    });

  } catch (error) {
    console.error("Events status API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Check if event has registrations
    const { data: registrations } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_config_id", eventId)
      .limit(1);

    if (registrations && registrations.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete event with existing registrations" 
      }, { status: 400 });
    }

    // Delete event
    const { error: deleteError } = await supabase
      .from("event_configs")
      .delete()
      .eq("id", eventId);

    if (deleteError) {
      console.error("Event deletion error:", deleteError);
      return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Event deleted successfully" 
    });

  } catch (error) {
    console.error("Events delete API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
