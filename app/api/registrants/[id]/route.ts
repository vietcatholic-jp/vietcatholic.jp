import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateGoWithSchema = z.object({
  go_with: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const registrantId = params.id;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateGoWithSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    // Verify ownership or admin rights
    const { data: registrant, error: registrantError } = await supabase
      .from("registrants")
      .select("id, registration_id, registrations!inner(user_id), id")
      .eq("id", registrantId)
      .single();

    if (registrantError || !registrant) {
      return NextResponse.json({ error: "Registrant not found" }, { status: 404 });
    }

    // Determine if user is owner or admin
    const registration = registrant.registrations as unknown as { user_id: string };
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

    const { error: updateError } = await supabase
      .from("registrants")
      .update({
        go_with: parsed.data.go_with,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrantId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update registrant" }, { status: 500 });
    }

    return NextResponse.json({ success: true, registrantId, go_with: parsed.data.go_with });
  } catch (error) {
    console.error("Update go_with error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
