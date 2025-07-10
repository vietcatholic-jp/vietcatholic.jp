import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Cancel registration
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get registration with registrants
    const { data: registration, error: fetchError } = await supabase
      .from("registrations")
      .select(`
        *,
        registrants(id)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Check if user owns this registration
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = registration.user_id === user.id;
    const isAdmin = profile?.role && ["super_admin", "regional_admin"].includes(profile.role);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if registration can be cancelled
    const cancellableStatuses = ['pending', 'report_paid', 'confirm_paid', 'payment_rejected'];
    if (!cancellableStatuses.includes(registration.status)) {
      return NextResponse.json({ 
        error: "Cannot cancel registration - invalid status" 
      }, { status: 400 });
    }

    // Check for tickets (cannot cancel if tickets exist)
    const registrantIds = registration.registrants?.map((r: { id: string }) => r.id) || [];
    let hasTickets = false;
    
    if (registrantIds.length > 0) {
      const { count: ticketCount } = await supabase
        .from("tickets")
        .select("*", { count: 'exact', head: true })
        .in("registrant_id", registrantIds);
      
      hasTickets = (ticketCount || 0) > 0;
    }

    if (hasTickets) {
      return NextResponse.json({ 
        error: "Cannot cancel registration - tickets have been generated" 
      }, { status: 400 });
    }

    // Check cancellation deadline if exists
    const { data: eventConfig } = await supabase
      .from("event_configs")
      .select("cancellation_deadline")
      .eq("is_active", true)
      .single();

    if (eventConfig?.cancellation_deadline) {
      const deadline = new Date(eventConfig.cancellation_deadline);
      const now = new Date();
      if (now > deadline) {
        return NextResponse.json({ 
          error: "Cancellation deadline has passed" 
        }, { status: 400 });
      }
    }

    // Update registration status to cancelled
    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Cancel registration error:", updateError);
      return NextResponse.json({ error: "Failed to cancel registration" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Registration cancelled successfully" 
    });

  } catch (error) {
    console.error("Cancel registration API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
