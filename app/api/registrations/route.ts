import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventParticipationRole, PROVINCE_REGION_MAPPING } from "@/lib/types";
import { cleanPhoneNumber, isValidJapanesePhoneNumber, PHONE_VALIDATION_MESSAGES } from "@/lib/phone-validation";
import { EventLogger } from "@/lib/logging/event-logger";
import { createRequestContext, calculateDuration } from "@/lib/logging/request-context";
import { REGISTRATION_EVENT_TYPES, EVENT_CATEGORIES } from "@/lib/logging/types";

const RegistrantSchema = z.object({
  email: z.string().email().optional(),
  saint_name: z.string().optional(),
  full_name: z.string().min(1),
  gender: z.enum(['male', 'female', 'other']),
  age_group: z.enum(['under_12', '12_17', '18_25', '26_35', '36_50', 'over_50']),
  province: z.string().optional(),
  diocese: z.string().optional(),
  address: z.string().optional(),
  facebook_link: z.string().url().optional().or(z.literal("")),
  phone: z.string()
    .optional()
    .transform((val) => val ? cleanPhoneNumber(val) : val)
    .refine((val) => !val || isValidJapanesePhoneNumber(val), {
      message: PHONE_VALIDATION_MESSAGES.INVALID_JAPANESE_FORMAT
    }),
  shirt_size: z.enum(['1','2','3','4','5','XS','S','M','L','XL','XXL','3XL','4XL','M-XS', 'M-S', 'M-M', 'M-L', 'M-XL', 'M-XXL', 'M-3XL', 'M-4XL', 'F-XS', 'F-S', 'F-M', 'F-L', 'F-XL', 'F-XXL'] as const),
  event_role: z.string() as z.ZodType<EventParticipationRole>,
  is_primary: z.boolean(),
  second_day_only: z.boolean(),
  notes: z.string().optional(),
});

const RegistrationSchema = z.object({
  registrants: z.array(RegistrantSchema).min(1),
  notes: z.string().optional(),
});
export async function POST(request: NextRequest) {
  
  const context = createRequestContext(request);
  const logger = new EventLogger();
  //const startTime = Date.now();
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
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

    // Log registration attempt start
    await logger.logInfo(
      REGISTRATION_EVENT_TYPES.REGISTRATION_STARTED,
      EVENT_CATEGORIES.REGISTRATION,
      {
        ...context,
        userId: user.id,
        userEmail: user.email,
      }
    );

    const body = await request.json();
    let validated;
    try {
      validated = RegistrationSchema.parse(body);
    } catch (error) {
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

    // Get active event config
    const { data: eventConfig } = await supabase
      .from("event_configs")
      .select("*")
      .eq("is_active", true)
      .single();

    const basePrice = eventConfig?.base_price || 6000;
    // Generate invoice code using the existing function
    const { data: invoiceResult } = await supabase.rpc('generate_invoice_code');
    const invoiceCode = invoiceResult || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
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
      // Full price for adults full event (no change needed)
      
      return total + price;
    }, 0);

    // Create registration record
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({
        user_id: user.id,
        event_config_id: eventConfig?.id,
        invoice_code: invoiceCode,
        status: "pending",
        total_amount: totalAmount,
        participant_count: validated.registrants.length,
        notes: validated.notes,
      })
      .select()
      .single();

    if (regError) {
      await logger.logError(
        REGISTRATION_EVENT_TYPES.REGISTRATION_FAILED,
        EVENT_CATEGORIES.REGISTRATION,
        new Error(regError.message),
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          eventData: { registrationData: {
            user_id: user.id,
            event_config_id: eventConfig?.id,
            invoice_code: invoiceCode,
            status: "pending",
            total_amount: totalAmount,
            participant_count: validated.registrants.length,
            notes: validated.notes,
          } },
          errorDetails: { databaseError: regError },
          durationMs: calculateDuration(context),
          tags: ['database_error'],
        }
      );
      return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
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
        second_day_only?: boolean;
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
        second_day_only: registrant.second_day_only,
        notes: registrant.notes,
      };
      if (registrant.event_role === 'participant') {
        data.event_team_id = null;
        data.event_role_id = null;
      } else {
        data.event_team_id = null;
        data.event_role_id = registrant.event_role;
      }
      return data;
    });

    const { error: registrantsError } = await supabase
      .from("registrants")
      .insert(registrantsData);

    if (registrantsError) {
      await logger.logError(
        REGISTRATION_EVENT_TYPES.REGISTRATION_FAILED,
        EVENT_CATEGORIES.REGISTRATION,
        new Error(registrantsError.message),
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          registrationId: registration.id,
          eventData: { registrantsError },
          errorDetails: { databaseError: registrantsError },
          durationMs: calculateDuration(context),
          tags: ['database_error'],
        }
      );
      // Try to clean up the registration record
      await supabase.from("registrations").delete().eq("id", registration.id);
      return NextResponse.json({ error: "Failed to create registrants" }, { status: 500 });
    }

    // Update user profile with primary registrant information if fields are empty
    try {
      // Find the primary registrant
      const primaryRegistrant = validated.registrants.find(r => r.is_primary);
      if (primaryRegistrant) {
        // Get current user profile
        const { data: currentProfile } = await supabase
          .from("users")
          .select("province, region, facebook_url")
          .eq("id", user.id)
          .single();

        if (currentProfile) {
          const updates: { province?: string; region?: string; facebook_url?: string } = {};

          // Update province if empty and primary registrant has it
          if (!currentProfile.province && primaryRegistrant.province) {
            updates.province = primaryRegistrant.province;
          }

          // Update region if empty and we can derive it from province
          if (!currentProfile.region && primaryRegistrant.province && PROVINCE_REGION_MAPPING[primaryRegistrant.province]) {
            updates.region = PROVINCE_REGION_MAPPING[primaryRegistrant.province];
          }

          // Update facebook_url if empty and primary registrant has facebook_link
          if (!currentProfile.facebook_url && primaryRegistrant.facebook_link) {
            updates.facebook_url = primaryRegistrant.facebook_link;
          }

          // Apply updates if there are any
          if (Object.keys(updates).length > 0) {
            await supabase
              .from("users")
              .update(updates)
              .eq("id", user.id);
          }
        }
      }
    } catch (profileUpdateError) {
      // Log the error but don't fail the registration
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.REGISTRATION_CREATED,
        EVENT_CATEGORIES.REGISTRATION,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          registrationId: registration.id,
          eventData: { profileUpdateError: profileUpdateError instanceof Error ? profileUpdateError.message : 'Unknown profile update error' },
          durationMs: calculateDuration(context),
          tags: ['profile_update_failed'],
        }
      );
    }

    await logger.logInfo(
      REGISTRATION_EVENT_TYPES.REGISTRATION_CREATED,
      EVENT_CATEGORIES.REGISTRATION,
      {
        ...context,
        userId: user.id,
        userEmail: user.email,
        registrationId: registration.id,
        invoiceCode: registration.invoice_code,
        eventData: {
          registrantCount: validated.registrants.length,
          totalAmount: registration.total_amount
        },
        durationMs: calculateDuration(context),
      }
    );

    return NextResponse.json({
      success: true,
      registration,
      invoiceCode
    });

  } catch (error) {
    await logger.logCritical(
      REGISTRATION_EVENT_TYPES.REGISTRATION_FAILED,
      EVENT_CATEGORIES.REGISTRATION,
      error as Error,
      {
        ...context,
        durationMs: calculateDuration(context),
        tags: ['unexpected_error'],
      }
    );
    console.error("Registration API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed",
        details: error.errors
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
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
      .select("role, region")
      .eq("id", user.id)
      .single();

    if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build query based on admin type
    let query = supabase
      .from("registrations")
      .select(`
        *,
        registrants(*),
        receipts(*),
        user:users(email, full_name, region)
      `)
      .order("created_at", { ascending: false });

    // Regional admins can only see their region's registrations
    if (profile.role === "regional_admin") {
      // Filter by user's region since registrants don't have region field anymore
      query = query.eq("user.region", profile.region);
    }

    const { data: registrations, error } = await query;

    if (error) {
      console.error("Fetch registrations error:", error);
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
    }

    return NextResponse.json({ registrations });

  } catch (error) {
    console.error("Get registrations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
