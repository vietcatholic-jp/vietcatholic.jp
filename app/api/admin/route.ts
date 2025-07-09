import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: profile } = await supabase
      .from("users")
      .select("role, region")
      .eq("id", user.id)
      .single();

    if (!profile || !["event_organizer", "group_leader", "regional_admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get statistics
    const registrationQuery = supabase.from("registrations").select("*", { count: 'exact', head: true });
    const confirmationQuery = supabase.from("registrations").select("*", { count: 'exact', head: true }).eq("status", "confirmed");
    const pendingQuery = supabase.from("registrations").select("*", { count: 'exact', head: true }).eq("status", "pending");
    const participantQuery = supabase.from("registrants").select("*", { count: 'exact', head: true });

    const [totalRegistrations, confirmedRegistrations, pendingRegistrations, totalParticipants] = await Promise.all([
      registrationQuery,
      confirmationQuery,
      pendingQuery,
      participantQuery
    ]);

    // Get recent registrations with role-based filtering
    let recentQuery = supabase
      .from("registrations")
      .select(`
        *,
        registrants(count),
        user:users(email, full_name, region)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    // Filter based on user role and region
    if (profile.role === "regional_admin" && profile.region) {
      recentQuery = recentQuery.eq("user.region", profile.region);
    } else if ((profile.role === "group_leader" || profile.role === "event_organizer") && profile.region) {
      recentQuery = recentQuery.eq("user.region", profile.region);
    }

    const { data: recentRegistrations } = await recentQuery;

    // Get regional breakdown (super admin only)
    let regionalStats = null;
    if (profile.role === "super_admin") {
      const { data: regions } = await supabase
        .from("users")
        .select("region")
        .not("region", "is", null)
        .order("region");

      if (regions) {
        const regionCounts = regions.reduce((acc: Record<string, number>, curr: { region: string }) => {
          acc[curr.region] = (acc[curr.region] || 0) + 1;
          return acc;
        }, {});

        regionalStats = Object.entries(regionCounts).map(([region, count]) => ({
          region,
          count,
        }));
      }
    }

    return NextResponse.json({
      stats: {
        totalRegistrations: totalRegistrations.count || 0,
        confirmedRegistrations: confirmedRegistrations.count || 0,
        pendingRegistrations: pendingRegistrations.count || 0,
        totalParticipants: totalParticipants.count || 0,
      },
      recentRegistrations: recentRegistrations || [],
      regionalStats,
      userProfile: {
        role: profile.role,
        region: profile.region
      },
    });

  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, userId, newRole, newRegion } = await request.json();

    switch (action) {
      case "update_user_role":
        if (!userId || !newRole) {
          return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { error: updateError } = await supabase
          .from("users")
          .update({ 
            role: newRole,
            region: newRegion || null,
            updated_at: new Date().toISOString() 
          })
          .eq("id", userId);

        if (updateError) {
          console.error("User role update error:", updateError);
          return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          message: "User role updated successfully" 
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Admin action API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
