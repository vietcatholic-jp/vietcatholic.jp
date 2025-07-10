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

    if (registration.status !== "pending") {
      return NextResponse.json({ error: "Registration is not pending" }, { status: 400 });
    }

    // Create receipt record
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        registration_id: registration.id,
        file_path: validated.receiptUrl,
        file_name: validated.receiptUrl.split('/').pop() || "receipt.jpg",
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
      .update({ status: "report_paid" })
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

    const { registrationId, status, adminNotes } = await request.json();

    if (!["confirm_paid", "payment_rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Find the registration to update
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (registration.status !== "report_paid") {
      return NextResponse.json({ error: "Registration is not in report_paid status" }, { status: 400 });
    }

    // Update registration status
    const newRegStatus = status === "confirm_paid" ? "confirmed" : "payment_rejected";
    const { error: regUpdateError } = await supabase
      .from("registrations")
      .update({ 
        status: newRegStatus,
        notes: adminNotes || registration.notes 
      })
      .eq("id", registrationId);

    if (regUpdateError) {
      console.error("Registration status update error:", regUpdateError);
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
    }

    // If confirmed, generate tickets
    if (status === "confirm_paid") {
      const { data: registrants } = await supabase
        .from("registrants")
        .select("*")
        .eq("registration_id", registrationId);

      if (registrants) {
        const ticketsData = registrants.map(registrant => ({
          registrant_id: registrant.id,
          qr_code: `QR-${Date.now()}-${registrant.id}`,
        }));

        await supabase.from("tickets").insert(ticketsData);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Payment ${status === "confirm_paid" ? "confirmed" : "rejected"} successfully` 
    });

  } catch (error) {
    console.error("Payment admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
