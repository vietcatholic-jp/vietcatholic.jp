import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { EventLogger } from "@/lib/logging/event-logger";
import { createRequestContext, calculateDuration } from "@/lib/logging/request-context";
import { REGISTRATION_EVENT_TYPES, EVENT_CATEGORIES } from "@/lib/logging/types";

// Registrant schema for admin registration
const AdminRegistrantSchema = z.object({
  saint_name: z.string().optional(),
  full_name: z.string().min(1, "Họ và tên là bắt buộc"),
  gender: z.enum(['male', 'female', 'other'] as const),
  age_group: z.enum(['under_12','12_17', '18_25', '26_35', '36_50', 'over_50'] as const),
  province: z.string().optional(),
  diocese: z.string().optional(),
  shirt_size: z.enum(['1','2','3','4','5','XS','S','M','L','XL','XXL','3XL','4XL','M-XS', 'M-S', 'M-M', 'M-L', 'M-XL', 'M-XXL', 'M-3XL', 'M-4XL', 'F-XS', 'F-S', 'F-M', 'F-L', 'F-XL', 'F-XXL'] as const),
  event_role: z.string(),
  is_primary: z.boolean(),
  go_with: z.boolean().optional(),
  second_day_only: z.boolean().optional(),
  selected_attendance_day: z.string().optional(),
  notes: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  facebook_link: z.string().url().optional().or(z.literal("")),
});

const AdminRegistrationSchema = z.object({
  registrants: z.array(AdminRegistrantSchema).min(1),
  notes: z.string().optional(),
  // Admin can specify target user for the registration
  target_user_email: z.string().email("Email người dùng không hợp lệ"),
  // Admin can force creation even with inactive event
  force_inactive_event: z.boolean().optional(),
  // Admin can specify event config id
  event_config_id: z.string().optional(),
  // Admin can use their own profile when target user doesn't exist
  use_admin_profile: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  const logger = new EventLogger();
  
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient(); // Admin client to bypass RLS
    
    // Get the authenticated user (admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.AUTHENTICATION_ERROR,
        EVENT_CATEGORIES.REGISTRATION,
        {
          ...context,
          errorDetails: { authError: authError?.message },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (registration_manager or super_admin)
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "registration_manager"].includes(profile.role)) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.AUTHORIZATION_ERROR,
        EVENT_CATEGORIES.REGISTRATION,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          eventData: { userRole: profile?.role, requiredRoles: ["super_admin", "registration_manager"] },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Log admin registration attempt start
    await logger.logInfo(
      REGISTRATION_EVENT_TYPES.ADMIN_REGISTRATION_MODIFIED,
      EVENT_CATEGORIES.REGISTRATION,
      {
        ...context,
        userId: user.id,
        userEmail: user.email,
        eventData: { action: "create_registration_for_user" },
      }
    );

    const body = await request.json();
    let validated;
    
    try {
      validated = AdminRegistrationSchema.parse(body);
    } catch (error) {
      console.error("Validation error:", error);
      await logger.logError(
        REGISTRATION_EVENT_TYPES.REGISTRANT_VALIDATION_ERROR,
        EVENT_CATEGORIES.REGISTRATION,
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
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }

    // Find the target user or use admin if specified
    let targetUser;
    if (validated.use_admin_profile) {
      // Use admin as target user
      targetUser = user;
    } else {
      // Find the specified target user
      const { data: foundUser, error: targetUserError } = await supabase
        .from("users")
        .select("*")
        .eq("email", validated.target_user_email)
        .single();

      if (targetUserError || !foundUser) {
        await logger.logWarning(
          REGISTRATION_EVENT_TYPES.ADMIN_REGISTRATION_MODIFIED,
          EVENT_CATEGORIES.REGISTRATION,
          {
            ...context,
            userId: user.id,
            userEmail: user.email,
            eventData: { 
              action: "create_registration_for_user",
              targetEmail: validated.target_user_email,
              error: "Target user not found"
            },
            durationMs: calculateDuration(context),
          }
        );
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }
      targetUser = foundUser;
    }

    // Get event config - allow inactive events for admin
    let eventConfig;
    if (validated.event_config_id) {
      // Admin specified a specific event
      const { data: specificEvent } = await supabase
        .from("event_configs")
        .select("*")
        .eq("id", validated.event_config_id)
        .single();
      eventConfig = specificEvent;
    } else {
      // Get active event first, then fall back to any event if force_inactive_event is true
      const { data: activeEvent } = await supabase
        .from("event_configs")
        .select("*")
        .eq("is_active", true)
        .single();
      
      if (!activeEvent && validated.force_inactive_event) {
        // Get the most recent event
        const { data: recentEvents } = await supabase
          .from("event_configs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);
        eventConfig = recentEvents?.[0];
      } else {
        eventConfig = activeEvent;
      }
    }

    if (!eventConfig) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.ADMIN_REGISTRATION_MODIFIED,
        EVENT_CATEGORIES.REGISTRATION,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          eventData: { 
            action: "create_registration_for_user",
            error: "No event config available"
          },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "No event configuration available" }, { status: 400 });
    }

    const basePrice = eventConfig.base_price || 6000;
    
    // Generate invoice code
    const { data: invoiceResult } = await supabase.rpc('generate_invoice_code');
    const invoiceCode = invoiceResult || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Calculate total amount
    const totalAmount = validated.registrants.reduce((total, registrant) => {
      let price = basePrice;
      
      // Children under 12 pricing
      if (registrant.age_group === 'under_12') {
        if (registrant.second_day_only) {
          price = basePrice * 0.25; // 1/4 price for children second day only
        } else {
          price = basePrice * 0.5; // Half price for children full event
        }
      }
      // Adults pricing
      else if (registrant.second_day_only) {
        price = basePrice * 0.5; // Half price for adults second day only
      }
      
      return total + price;
    }, 0);

    // Create registration record for target user (using admin client to bypass RLS)
    const { data: registration, error: regError } = await adminSupabase
      .from("registrations")
      .insert({
        user_id: targetUser.id,
        event_config_id: eventConfig.id,
        invoice_code: invoiceCode,
        status: "temp_confirmed", // Admin created registrations start as temp_confirmed
        total_amount: totalAmount,
        participant_count: validated.registrants.length,
        notes: `Created by admin ${user.email} ${validated.use_admin_profile ? '(using admin profile)' : `for user ${targetUser.email}`}. ${validated.notes || ''}`,
      })
      .select()
      .single();

    if (regError) {
	  console.error("Registration creation error:", regError);
      await logger.logError(
        REGISTRATION_EVENT_TYPES.REGISTRATION_FAILED,
        EVENT_CATEGORIES.REGISTRATION,
        new Error(regError.message),
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          eventData: { 
            action: "create_registration_for_user",
            targetUser: targetUser.id,
            targetEmail: targetUser.email,
            registrationData: {
              user_id: targetUser.id,
              event_config_id: eventConfig.id,
              invoice_code: invoiceCode,
              status: "pending",
              total_amount: totalAmount,
              participant_count: validated.registrants.length,
            }
          },
          errorDetails: { databaseError: regError },
          durationMs: calculateDuration(context),
          tags: ['database_error'],
        }
      );
      return NextResponse.json({ error: "Lỗi khi tạo đăng ký" }, { status: 500 });
    }

    // Create registrant records
    const registrantsData = validated.registrants.map(registrant => {
      const data: {
        registration_id: string;
        email?: string;
        saint_name?: string;
        full_name: string;
        gender: string;
        age_group: string;
        province?: string;
        diocese?: string;
        address?: string;
        facebook_link?: string;
        phone?: string;
        shirt_size: string;
        is_primary: boolean;
        go_with?: boolean;
        second_day_only?: boolean;
        selected_attendance_day?: string;
        notes?: string;
        event_team_id?: string | null;
        event_role_id?: string | null;
      } = {
        registration_id: registration.id,
        email: registrant.email,
        saint_name: registrant.saint_name?.toUpperCase(),
        full_name: registrant.full_name.toUpperCase(),
        gender: registrant.gender,
        age_group: registrant.age_group,
        province: registrant.province,
        diocese: registrant.diocese,
        address: registrant.address,
        facebook_link: registrant.facebook_link,
        phone: registrant.phone,
        shirt_size: registrant.shirt_size,
        is_primary: registrant.is_primary,
        go_with: registrant.go_with,
        second_day_only: registrant.second_day_only,
        notes: registrant.notes,
      };
      if (registrant.second_day_only) {
        data.selected_attendance_day = registrant.selected_attendance_day;
      }
      if (registrant.event_role === 'participant') {
        data.event_team_id = null;
        data.event_role_id = null;
      } else {
        data.event_team_id = null;
        data.event_role_id = registrant.event_role;
      }
      return data;
    });


    const { error: registrantsError } = await adminSupabase
      .from("registrants")
      .insert(registrantsData);

    if (registrantsError) {
      // Log the error before cleanup (while registration still exists)
      await logger.logError(
        REGISTRATION_EVENT_TYPES.REGISTRATION_FAILED,
        EVENT_CATEGORIES.REGISTRATION,
        new Error(registrantsError.message),
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          registrationId: registration.id,
          eventData: { 
            action: "create_registrants_for_user",
            targetUser: targetUser.id,
            targetEmail: targetUser.email,
            registrantsData 
          },
          errorDetails: { databaseError: registrantsError },
          durationMs: calculateDuration(context),
          tags: ['database_error', 'cleanup_performed'],
        }
      );

      // Clean up registration after logging (using admin client)
      await adminSupabase.from("registrations").delete().eq("id", registration.id);
      console.error("Registrant creation error:", registrantsError);
      return NextResponse.json({ error: "Lỗi khi tạo thông tin người tham gia" }, { status: 500 });
    }

    await logger.logInfo(
      REGISTRATION_EVENT_TYPES.ADMIN_REGISTRATION_MODIFIED,
      EVENT_CATEGORIES.REGISTRATION,
      {
        ...context,
        userId: user.id,
        userEmail: user.email,
        registrationId: registration.id,
        invoiceCode: registration.invoice_code,
        eventData: {
          action: "create_registration_for_user",
          targetUser: targetUser.id,
          targetEmail: targetUser.email,
          registrantCount: validated.registrants.length,
          totalAmount: registration.total_amount,
          eventConfigId: eventConfig.id,
          isActiveEvent: eventConfig.is_active,
        },
        durationMs: calculateDuration(context),
      }
    );

    return NextResponse.json({
      success: true,
      registration,
      invoiceCode,
      message: `Registration created successfully for ${targetUser.email}`
    });

  } catch (error) {
    await logger.logCritical(
      REGISTRATION_EVENT_TYPES.REGISTRATION_FAILED,
      EVENT_CATEGORIES.REGISTRATION,
      error as Error,
      {
        ...context,
        durationMs: calculateDuration(context),
        tags: ['unexpected_error', 'admin_operation'],
      }
    );
    console.error("Admin Registration API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
