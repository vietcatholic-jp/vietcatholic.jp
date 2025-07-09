import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ invoiceCode: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceCode } = params;

    // Get registration with all related data
    const { data: registration, error } = await supabase
      .from("registrations")
      .select(`
        *,
        registrants(*),
        tickets(*),
        receipts(*)
      `)
      .eq("invoice_code", invoiceCode)
      .eq("user_id", user.id)
      .single();

    if (error || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (registration.status !== "confirmed") {
      return NextResponse.json({ 
        error: "Tickets not available. Registration must be confirmed first." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      registration,
      registrants: registration.registrants,
      tickets: registration.tickets
    });

  } catch (error) {
    console.error("Tickets API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ invoiceCode: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceCode } = params;
    const { registrantId, portraitUrl } = await request.json();

    // Verify the ticket belongs to the user
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        registrant:registrants(*),
        registration:registrations(user_id)
      `)
      .eq("registrant_id", registrantId)
      .eq("registrations.invoice_code", invoiceCode)
      .single();

    if (ticketError || !ticket || ticket.registration.user_id !== user.id) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Update ticket with portrait
    const { data: updatedTicket, error: updateError } = await supabase
      .from("tickets")
      .update({
        portrait_url: portraitUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id)
      .select()
      .single();

    if (updateError) {
      console.error("Ticket update error:", updateError);
      return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      ticket: updatedTicket,
      message: "Portrait updated successfully" 
    });

  } catch (error) {
    console.error("Ticket update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
