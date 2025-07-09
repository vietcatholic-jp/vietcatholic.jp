import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PaymentVerificationSchema = z.object({
  invoiceCode: z.string(),
  receiptUrl: z.string().url(),
  amount: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = PaymentVerificationSchema.parse(body);

    // Find the registration
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("*")
      .eq("invoice_code", validated.invoiceCode)
      .eq("user_id", user.id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (registration.status !== "pending_payment") {
      return NextResponse.json({ error: "Registration is not pending payment" }, { status: 400 });
    }

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        registration_id: registration.id,
        receipt_url: validated.receiptUrl,
        amount: validated.amount,
        notes: validated.notes,
        status: "pending_verification",
      })
      .select()
      .single();

    if (receiptError) {
      console.error("Receipt creation error:", receiptError);
      return NextResponse.json({ error: "Failed to create receipt" }, { status: 500 });
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ status: "payment_submitted" })
      .eq("id", registration.id);

    if (updateError) {
      console.error("Registration update error:", updateError);
      // Try to clean up the receipt
      await supabase.from("receipts").delete().eq("id", receipt.id);
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      receipt,
      message: "Payment receipt submitted successfully. We will verify it within 24 hours." 
    });

  } catch (error) {
    console.error("Payment verification API error:", error);
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

    const { receiptId, status, adminNotes } = await request.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update receipt status
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .update({
        status,
        admin_notes: adminNotes,
        verified_at: status === "approved" ? new Date().toISOString() : null,
        verified_by: user.id,
      })
      .eq("id", receiptId)
      .select()
      .single();

    if (receiptError) {
      console.error("Receipt update error:", receiptError);
      return NextResponse.json({ error: "Failed to update receipt" }, { status: 500 });
    }

    // Update registration status
    const newRegStatus = status === "approved" ? "confirmed" : "payment_rejected";
    const { error: regUpdateError } = await supabase
      .from("registrations")
      .update({ status: newRegStatus })
      .eq("id", receipt.registration_id);

    if (regUpdateError) {
      console.error("Registration status update error:", regUpdateError);
    }

    // If approved, generate tickets
    if (status === "approved") {
      const { data: registrants } = await supabase
        .from("registrants")
        .select("*")
        .eq("registration_id", receipt.registration_id);

      if (registrants) {
        const ticketsData = registrants.map(registrant => ({
          registrant_id: registrant.id,
          registration_id: receipt.registration_id,
          ticket_code: `TKT-${Date.now()}-${registrant.id}`,
          status: "active",
        }));

        await supabase.from("tickets").insert(ticketsData);
      }
    }

    return NextResponse.json({ 
      success: true, 
      receipt,
      message: `Payment ${status} successfully` 
    });

  } catch (error) {
    console.error("Payment admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
