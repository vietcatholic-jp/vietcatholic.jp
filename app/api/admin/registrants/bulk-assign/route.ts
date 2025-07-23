import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const BulkAssignSchema = z.object({
  registrant_ids: z.array(z.string().uuid()).min(1, "At least one registrant ID is required"),
  team_id: z.string().uuid("Invalid team ID"),
  notes: z.string().optional(),
});

interface BulkAssignResult {
  success: string[];
  failed: Array<{
    registrant_id: string;
    registrant_name: string;
    reason: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, region")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["event_organizer", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { registrant_ids, team_id, notes } = BulkAssignSchema.parse(body);

    // Validate team exists and get capacity info
    const { data: team, error: teamError } = await supabase
      .from("event_teams")
      .select(`
        id,
        name,
        capacity,
        registrants:registrants!registrants_event_team_id_fkey(id)
      `)
      .eq("id", team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get all registrants to be assigned
    const { data: registrants, error: registrantsError } = await supabase
      .from("registrants")
      .select(`
        id,
        full_name,
        event_team_id,
        registration:registrations!registrants_registration_id_fkey(
          id,
          user:users!registrations_user_id_fkey(
            region
          )
        )
      `)
      .in("id", registrant_ids);

    if (registrantsError) {
      return NextResponse.json({ error: "Failed to fetch registrants" }, { status: 500 });
    }

    const result: BulkAssignResult = {
      success: [],
      failed: []
    };

    // Check team capacity
    const currentTeamSize = team.registrants?.length || 0;
    const availableSlots = team.capacity ? team.capacity - currentTeamSize : registrant_ids.length;

    if (team.capacity && registrant_ids.length > availableSlots) {
      return NextResponse.json({ 
        error: `Not enough capacity. Team has ${availableSlots} available slots but trying to assign ${registrant_ids.length} people.` 
      }, { status: 400 });
    }

    // Process each registrant
    for (const registrant of registrants || []) {
      try {
        // Regional admin permission check
        if (profile.role === "regional_admin" && profile.region) {
          if (registrant.registration.user.region !== profile.region) {
            result.failed.push({
              registrant_id: registrant.id,
              registrant_name: registrant.full_name,
              reason: "Cannot assign registrants from other regions"
            });
            continue;
          }
        }

        // Check if already assigned
        if (registrant.event_team_id) {
          result.failed.push({
            registrant_id: registrant.id,
            registrant_name: registrant.full_name,
            reason: "Already assigned to a team"
          });
          continue;
        }

        // Assign to team
        const { error: updateError } = await supabase
          .from("registrants")
          .update({ 
            event_team_id: team_id,
            updated_at: new Date().toISOString()
          })
          .eq("id", registrant.id);

        if (updateError) {
          result.failed.push({
            registrant_id: registrant.id,
            registrant_name: registrant.full_name,
            reason: "Database update failed"
          });
        } else {
          result.success.push(registrant.id);
        }

      } catch (error) {
        result.failed.push({
          registrant_id: registrant.id,
          registrant_name: registrant.full_name,
          reason: "Unexpected error during assignment"
        });
      }
    }

    return NextResponse.json({
      success: result.success,
      failed: result.failed,
      summary: {
        total: registrant_ids.length,
        successful: result.success.length,
        failed: result.failed.length,
        team_name: team.name
      }
    });

  } catch (error) {
    console.error("Bulk assign API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
