import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventLogger } from "@/lib/logging/event-logger";
import { createRequestContext, calculateDuration } from "@/lib/logging/request-context";
import { REGISTRATION_EVENT_TYPES, EVENT_CATEGORIES } from "@/lib/logging/types";

const PaymentVerificationSchema = z.object({
  invoiceCode: z.string(),
  receiptUrl: z.string().url(),
  amount: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  const logger = new EventLogger();
  
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.AUTHENTICATION_ERROR,
        EVENT_CATEGORIES.PAYMENT,
        {
          ...context,
          errorDetails: { authError: authError?.message },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let validated;
    try {
      validated = PaymentVerificationSchema.parse(body);
    } catch (error) {
      await logger.logError(
        REGISTRATION_EVENT_TYPES.PAYMENT_VALIDATION_ERROR,
        EVENT_CATEGORIES.PAYMENT,
        error as Error,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          eventData: { 
            submittedData: body,
            validationErrors: error instanceof z.ZodError ? error.errors : undefined 
          },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error instanceof z.ZodError ? error.errors : undefined 
      }, { status: 400 });
    }

    // Find the registration
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("*")
      .eq("invoice_code", validated.invoiceCode)
      .eq("user_id", user.id)
      .single();

    if (regError || !registration) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.PAYMENT_RECEIPT_FAILED,
        EVENT_CATEGORIES.PAYMENT,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          invoiceCode: validated.invoiceCode,
          eventData: { reason: "Registration not found" },
          errorDetails: { databaseError: regError },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (registration.status !== "pending") {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.PAYMENT_RECEIPT_FAILED,
        EVENT_CATEGORIES.PAYMENT,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          registrationId: registration.id,
          invoiceCode: validated.invoiceCode,
          eventData: { 
            currentStatus: registration.status,
            reason: "Registration is not pending" 
          },
          durationMs: calculateDuration(context),
        }
      );
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
      await logger.logError(
        REGISTRATION_EVENT_TYPES.PAYMENT_RECEIPT_FAILED,
        EVENT_CATEGORIES.PAYMENT,
        new Error(receiptError.message),
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          registrationId: registration.id,
          invoiceCode: validated.invoiceCode,
          eventData: { 
            receiptUrl: validated.receiptUrl,
            amount: validated.amount 
          },
          errorDetails: { databaseError: receiptError },
          durationMs: calculateDuration(context),
          tags: ['database_error'],
        }
      );
      console.error("Receipt creation error:", receiptError);
      return NextResponse.json({ error: "Failed to create receipt" }, { status: 500 });
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from("registrations")
      .update({ status: "report_paid" })
      .eq("id", registration.id);

    if (updateError) {
      await logger.logError(
        REGISTRATION_EVENT_TYPES.PAYMENT_RECEIPT_FAILED,
        EVENT_CATEGORIES.PAYMENT,
        new Error(updateError.message),
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          registrationId: registration.id,
          invoiceCode: validated.invoiceCode,
          eventData: { 
            receiptId: receipt.id,
            reason: "Failed to update registration status" 
          },
          errorDetails: { databaseError: updateError },
          durationMs: calculateDuration(context),
          tags: ['database_error', 'status_update_failed'],
        }
      );
      console.error("Registration update error:", updateError);
      // Try to clean up the receipt
      await supabase.from("receipts").delete().eq("id", receipt.id);
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
    }

    // Log successful payment receipt upload
    await logger.logInfo(
      REGISTRATION_EVENT_TYPES.PAYMENT_RECEIPT_UPLOADED,
      EVENT_CATEGORIES.PAYMENT,
      {
        ...context,
        userId: user.id,
        userEmail: user.email,
        registrationId: registration.id,
        invoiceCode: validated.invoiceCode,
        eventData: { 
          receiptId: receipt.id,
          receiptUrl: validated.receiptUrl,
          amount: validated.amount,
          fileName: receipt.file_name,
          notes: validated.notes 
        },
        durationMs: calculateDuration(context),
      }
    );

    return NextResponse.json({ 
      success: true, 
      receipt,
      message: "Biên lai đóng phí tham dự đã được gửi thành công. Chúng tôi sẽ xác minh trong vòng 24 giờ."
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
  const context = createRequestContext(request);
  const logger = new EventLogger();
  
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.AUTHENTICATION_ERROR,
        EVENT_CATEGORIES.PAYMENT,
        {
          ...context,
          errorDetails: { authError: authError?.message },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.AUTHORIZATION_ERROR,
        EVENT_CATEGORIES.PAYMENT,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          eventData: { 
            userRole: profile?.role || 'unknown',
            requiredRoles: ['super_admin', 'regional_admin']
          },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { registrationId, status, adminNotes } = body;

    if (!["confirm_paid", "payment_rejected"].includes(status)) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.PAYMENT_VALIDATION_ERROR,
        EVENT_CATEGORIES.PAYMENT,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          eventData: { 
            submittedStatus: status,
            validStatuses: ["confirm_paid", "payment_rejected"],
            registrationId
          },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Find the registration to update
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", registrationId)
      .single();

    if (regError || !registration) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.ADMIN_PAYMENT_REVIEWED,
        EVENT_CATEGORIES.PAYMENT,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          registrationId,
          eventData: { 
            reason: "Registration not found",
            requestedAction: status
          },
          errorDetails: { databaseError: regError },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    if (registration.status !== "report_paid") {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.ADMIN_PAYMENT_REVIEWED,
        EVENT_CATEGORIES.PAYMENT,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          registrationId,
          invoiceCode: registration.invoice_code,
          eventData: { 
            currentStatus: registration.status,
            expectedStatus: "report_paid",
            requestedAction: status,
            reason: "Registration is not in report_paid status"
          },
          durationMs: calculateDuration(context),
        }
      );
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
      await logger.logError(
        REGISTRATION_EVENT_TYPES.ADMIN_PAYMENT_REVIEWED,
        EVENT_CATEGORIES.PAYMENT,
        new Error(regUpdateError.message),
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          registrationId,
          invoiceCode: registration.invoice_code,
          eventData: { 
            requestedAction: status,
            newStatus: newRegStatus,
            adminNotes,
            reason: "Failed to update registration status"
          },
          errorDetails: { databaseError: regUpdateError },
          durationMs: calculateDuration(context),
          tags: ['database_error', 'admin_action_failed'],
        }
      );
      console.error("Registration status update error:", regUpdateError);
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
    }

    // If confirmed, generate tickets
    if (status === "confirm_paid") {
      const { data: registrants } = await supabase
        .from("registrants")
        .select("*")
        .eq("registration_id", registrationId);

      if (registrants && registrants.length > 0) {
        const ticketsData = registrants.map(registrant => ({
          registrant_id: registrant.id,
          qr_code: `QR-${Date.now()}-${registrant.id}`,
        }));

        const { error: ticketError } = await supabase.from("tickets").insert(ticketsData);
        
        if (ticketError) {
          await logger.logError(
            REGISTRATION_EVENT_TYPES.ADMIN_PAYMENT_REVIEWED,
            EVENT_CATEGORIES.PAYMENT,
            new Error(ticketError.message),
            {
              ...context,
              userId: user.id,
              userEmail: user.email,
              registrationId,
              invoiceCode: registration.invoice_code,
              eventData: { 
                requestedAction: status,
                ticketCount: registrants.length,
                reason: "Failed to generate tickets after payment confirmation"
              },
              errorDetails: { databaseError: ticketError },
              durationMs: calculateDuration(context),
              tags: ['database_error', 'ticket_generation_failed'],
            }
          );
          console.error("Ticket generation error:", ticketError);
          // Don't return error here as payment was already updated
        }
      }
    }

    // Log successful admin payment review
    const eventType = status === "confirm_paid" ? 
      REGISTRATION_EVENT_TYPES.PAYMENT_CONFIRMED : 
      REGISTRATION_EVENT_TYPES.PAYMENT_REJECTED;

    await logger.logInfo(
      eventType,
      EVENT_CATEGORIES.PAYMENT,
      {
        ...context,
        userId: user.id,
        userEmail: user.email,
        registrationId,
        invoiceCode: registration.invoice_code,
        eventData: { 
          adminAction: status,
          previousStatus: registration.status,
          newStatus: newRegStatus,
          adminNotes,
          adminRole: profile.role,
          participantCount: registration.participant_count,
          amount: registration.total_amount
        },
        durationMs: calculateDuration(context),
        tags: ['admin_action', 'payment_review'],
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: `Đóng phí tham dự ${status === "confirm_paid" ? "đã được xác nhận" : "đã bị từ chối"} thành công`
    });

  } catch (error) {
    await logger.logError(
      REGISTRATION_EVENT_TYPES.ADMIN_PAYMENT_REVIEWED,
      EVENT_CATEGORIES.PAYMENT,
      error as Error,
      {
        ...context,
        eventData: { reason: "Unexpected error in admin payment review" },
        errorDetails: { error: error instanceof Error ? error.message : String(error) },
        durationMs: calculateDuration(context),
        tags: ['unexpected_error', 'admin_action'],
      }
    );
    console.error("Payment admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
