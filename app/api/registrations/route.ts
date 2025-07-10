import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventParticipationRole } from "@/lib/types";
import { cleanPhoneNumber, isValidJapanesePhoneNumber, PHONE_VALIDATION_MESSAGES } from "@/lib/phone-validation";

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
  shirt_size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  event_role: z.string() as z.ZodType<EventParticipationRole>,
  is_primary: z.boolean(),
  notes: z.string().optional(),
});

const RegistrationSchema = z.object({
  registrants: z.array(RegistrantSchema).min(1),
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
    const validated = RegistrationSchema.parse(body);

    // Get active event config
    const { data: eventConfig } = await supabase
      .from("event_configs")
      .select("*")
      .eq("is_active", true)
      .single();

    const basePrice = eventConfig?.base_price || 6000; // Default 50,000 yen
    
    // Generate invoice code using the existing function
    const { data: invoiceResult } = await supabase.rpc('generate_invoice_code');
    const invoiceCode = invoiceResult || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create registration record
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({
        user_id: user.id,
        event_config_id: eventConfig?.id,
        invoice_code: invoiceCode,
        status: "pending",
        total_amount: validated.registrants.length * basePrice,
        participant_count: validated.registrants.length,
        notes: validated.notes,
      })
      .select()
      .single();

    if (regError) {
      console.error("Registration error:", regError);
      return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
    }

    // Create registrant records
    const registrantsData = validated.registrants.map(registrant => ({
      registration_id: registration.id,
      email: registrant.email,
      saint_name: registrant.saint_name,
      full_name: registrant.full_name,
      gender: registrant.gender,
      age_group: registrant.age_group,
      province: registrant.province,
      diocese: registrant.diocese,
      address: registrant.address,
      facebook_link: registrant.facebook_link,
      phone: registrant.phone,
      shirt_size: registrant.shirt_size,
      event_role: registrant.event_role,
      is_primary: registrant.is_primary,
      notes: registrant.notes,
    }));

    const { error: registrantsError } = await supabase
      .from("registrants")
      .insert(registrantsData);

    if (registrantsError) {
      console.error("Registrants error:", registrantsError);
      // Try to clean up the registration record
      await supabase.from("registrations").delete().eq("id", registration.id);
      return NextResponse.json({ error: "Failed to create registrants" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      registration,
      invoiceCode 
    });

  } catch (error) {
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
