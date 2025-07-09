import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ProfileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  region: z.enum([
    'kanto', 'kansai', 'chubu', 'kyushu', 'chugoku', 'shikoku', 'tohoku', 'hokkaido'
  ]).optional(),
  role: z.enum([
    'participant', 'event_organizer','group_leader', 'regional_admin', 'super_admin'
  ]).optional(),
  dateOfBirth: z.string().optional(),
  occupation: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    return NextResponse.json({ profile });

  } catch (error) {
    console.error("Profile API error:", error);
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

    const body = await request.json();
    const validated = ProfileUpdateSchema.parse(body);

    // Update user profile
    const { data: profile, error } = await supabase
      .from("users")
      .update({
        full_name: validated.firstName && validated.lastName,
        phone: validated.phone,
        region: validated.region,
        role: validated.role,
        date_of_birth: validated.dateOfBirth,
        occupation: validated.occupation,
        onboarding_completed: validated.onboardingCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      message: "Profile updated successfully" 
    });

  } catch (error) {
    console.error("Profile update API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
