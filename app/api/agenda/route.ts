import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";

const AgendaItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  sessionType: z.enum(["session", "break", "meal", "other", "plenary", "workshop", "mass", "cultural"]).optional(),
  speaker: z.string().nullable().optional(),
  maxParticipants: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  eventConfigId: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user (optional for public agenda)
    const { data: { user } } = await supabase.auth.getUser();

    // Build query based on user status
    let query = supabase
      .from("agenda_items")
      .select("*")
      .order("start_time", { ascending: true });

    // Non-authenticated users only see public items
    if (!user) {
      query = query.eq("is_public", true);
    } else {
      // Authenticated users see all items or filter based on role
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      // Regular users still only see public items
      if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
        query = query.eq("is_public", true);
      }
    }

    const { data: agendaItems, error } = await query;

    if (error) {
      console.error("Agenda fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch agenda" }, { status: 500 });
    }

    return NextResponse.json({ agendaItems: agendaItems || [] });

  } catch (error) {
    console.error("Agenda API error:", error);
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = AgendaItemSchema.parse(body);

    // Convert JST times to UTC for storage
    const startTimeUtc = fromZonedTime(validated.startTime, 'Asia/Tokyo').toISOString();
    const endTimeUtc = fromZonedTime(validated.endTime, 'Asia/Tokyo').toISOString();

    // Create agenda item
    const { data: agendaItem, error } = await supabase
      .from("agenda_items")
      .insert({
        title: validated.title,
        description: validated.description,
        start_time: startTimeUtc,
        end_time: endTimeUtc,
        venue: validated.venue,
        session_type: validated.sessionType,
        notes: validated.notes,
        event_config_id: validated.eventConfigId,
      })
      .select()
      .single();

    if (error) {
      console.error("Agenda item creation error:", error);
      return NextResponse.json({ error: "Failed to create agenda item" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      agendaItem,
      message: "Agenda item created successfully" 
    });

  } catch (error) {
    console.error("Agenda creation API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Agenda item ID required" }, { status: 400 });
    }

    // Validate updates
    const validated = AgendaItemSchema.partial().parse(updates);

    // Convert JST times to UTC if provided and map field names to database columns
    const updateData: {
      title?: string;
      description?: string | null;
      start_time?: string;
      end_time?: string;
      venue?: string | null;
      session_type?: string;
      speaker?: string | null;
      max_participants?: number | null;
      notes?: string | null;
    } = {};
    
    if (validated.title) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.venue !== undefined) updateData.venue = validated.venue;
    if (validated.sessionType !== undefined) updateData.session_type = validated.sessionType;
    if (validated.speaker !== undefined) updateData.speaker = validated.speaker;
    if (validated.maxParticipants !== undefined) updateData.max_participants = validated.maxParticipants;
    if (validated.notes !== undefined) updateData.notes = validated.notes;
    
    if (validated.startTime) {
      updateData.start_time = fromZonedTime(validated.startTime, 'Asia/Tokyo').toISOString();
    }
    if (validated.endTime) {
      updateData.end_time = fromZonedTime(validated.endTime, 'Asia/Tokyo').toISOString();
    }

    // Update agenda item
    const { data: agendaItem, error } = await supabase
      .from("agenda_items")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Agenda item update error:", error);
      return NextResponse.json({ error: "Failed to update agenda item" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      agendaItem,
      message: "Agenda item updated successfully" 
    });

  } catch (error) {
    console.error("Agenda update API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Agenda item ID required" }, { status: 400 });
    }

    // Delete agenda item
    const { error } = await supabase
      .from("agenda_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Agenda item deletion error:", error);
      return NextResponse.json({ error: "Failed to delete agenda item" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Agenda item deleted successfully" 
    });

  } catch (error) {
    console.error("Agenda deletion API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
