import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventParticipationRole } from "@/lib/types";
import { cleanPhoneNumber, isValidJapanesePhoneNumber, PHONE_VALIDATION_MESSAGES } from "@/lib/phone-validation";

const UpdateRegistrationSchema = z.object({
  registrants: z.array(z.object({
    id: z.string().optional(),
    email: z.string().email().optional(),
    saint_name: z.string().optional(),
    full_name: z.string().min(1),
    gender: z.enum(['male', 'female', 'other']),
    age_group: z.enum(['under_12','12_17', '18_25', '26_35', '36_50', 'over_50']),
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
  })).min(1),
  notes: z.string().optional(),
});

// PUT - Update registration
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = UpdateRegistrationSchema.parse(body);

    // Check if registration exists and belongs to user or user is admin
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select(`
        *,
        registrants(*)
      `)
      .eq("id", id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Check if user owns registration or is admin
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

    // Check if registration can be modified (no tickets exported and not confirmed)
    // Check for tickets separately to avoid RLS issues
    const registrantIds = registration.registrants?.map((r: { id: string }) => r.id) || [];
    let hasTickets = false;
    
    if (registrantIds.length > 0) {
      const { count: ticketCount } = await supabase
        .from("tickets")
        .select("*", { count: 'exact', head: true })
        .in("registrant_id", registrantIds);
      
      hasTickets = (ticketCount || 0) > 0;
    }

    if (registration.status === 'confirmed' || hasTickets) {
      return NextResponse.json({ 
        error: "Cannot modify registration - tickets have been exported or registration is confirmed" 
      }, { status: 400 });
    }

    // Get active event config for pricing
    const { data: eventConfig } = await supabase
      .from("event_configs")
      .select("*")
      .eq("is_active", true)
      .single();

    const basePrice = eventConfig?.base_price || 6000;

    // Update registration record
    const { error: updateRegError } = await supabase
      .from("registrations")
      .update({
        total_amount: validated.registrants.length * basePrice,
        participant_count: validated.registrants.length,
        notes: validated.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateRegError) {
      console.error("Update registration error:", updateRegError);
      return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
    }

    // Delete existing registrants
    const { error: deleteError } = await supabase
      .from("registrants")
      .delete()
      .eq("registration_id", id);

    if (deleteError) {
      console.error("Delete registrants error:", deleteError);
      return NextResponse.json({ error: "Failed to update registrants" }, { status: 500 });
    }

    // Insert updated registrants
    const registrantsData = validated.registrants.map(registrant => ({
      registration_id: id,
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

    const { error: insertError } = await supabase
      .from("registrants")
      .insert(registrantsData);

    if (insertError) {
      console.error("Insert registrants error:", insertError);
      return NextResponse.json({ error: "Failed to update registrants" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Registration updated successfully" 
    });

  } catch (error) {
    console.error("Update registration API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete registration
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if registration exists and belongs to user or user is admin
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select(`
        *,
        registrants(*)
      `)
      .eq("id", id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Check if user owns registration or is admin
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

    // Check if registration can be deleted (no tickets exported and not confirmed)
    // Check for tickets separately to avoid RLS issues
    const registrantIds = registration.registrants?.map((r: { id: string }) => r.id) || [];
    let hasTickets = false;
    
    if (registrantIds.length > 0) {
      const { count: ticketCount } = await supabase
        .from("tickets")
        .select("*", { count: 'exact', head: true })
        .in("registrant_id", registrantIds);
      
      hasTickets = (ticketCount || 0) > 0;
    }

    if (registration.status === 'confirmed' || hasTickets) {
      return NextResponse.json({ 
        error: "Cannot delete registration - tickets have been exported or registration is confirmed" 
      }, { status: 400 });
    }

    // For regular users, only allow deletion if status is 'pending'
    if (!isAdmin && registration.status !== 'pending') {
      return NextResponse.json({ 
        error: "Cannot delete registration - only pending registrations can be deleted" 
      }, { status: 400 });
    }

    // Delete registration (cascade will handle registrants and receipts)
    console.log("Attempting to delete registration with ID:", id);
    const { data: deleteResult, error: deleteError, count } = await supabase
      .from("registrations")
      .delete({ count: 'exact' })
      .eq("id", id);

    console.log("Delete result:", { deleteResult, deleteError, count });

    if (deleteError) {
      console.error("Delete registration error:", deleteError);
      return NextResponse.json({ error: "Failed to delete registration" }, { status: 500 });
    }

    if (count === 0) {
      console.error("No rows were deleted - registration may not exist or RLS may be blocking");
      return NextResponse.json({ error: "Registration not found or access denied" }, { status: 404 });
    }

    console.log(`Successfully deleted ${count} registration(s)`);
    return NextResponse.json({ 
      success: true, 
      message: "Registration deleted successfully",
      deletedCount: count
    });

  } catch (error) {
    console.error("Delete registration API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Get single registration
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Get registration with all related data
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select(`
        *,
        registrants(*),
        receipts(*),
        user:users(email, full_name, region)
      `)
      .eq("id", id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Check if user owns registration or is admin
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

    return NextResponse.json({ registration });

  } catch (error) {
    console.error("Get registration API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
