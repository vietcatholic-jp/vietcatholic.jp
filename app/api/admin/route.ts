import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getRegionFromProvince } from "@/lib/types";

interface DatabaseRegistrant {
  province?: string;
  [key: string]: unknown;
}

interface DatabaseRegistration {
  user?: {
    region?: string;
    [key: string]: unknown;
  };
  registrants?: DatabaseRegistrant[];
  [key: string]: unknown;
}

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

    if (!profile || !["event_organizer", "registration_manager", "group_leader", "regional_admin", "super_admin"].includes(profile.role)) {
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
        registrants(*, event_roles(name)),
        user:users(email, full_name, region, province)
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    // Filter based on user role and region
    if (profile.role === "regional_admin" && profile.region) {
      // Regional admin: see registrations from users in their region OR 
      // registrations where registrants have provinces in their region
      recentQuery = recentQuery.eq("user.region", profile.region);
    } else if (profile.role === "group_leader") {
      // Group leader: only see confirmed registrations from their region
      // where registrants have organizer_regional or similar group-related roles
      recentQuery = recentQuery
        .eq("user.region", profile.region)
        .eq("status", "confirmed");
    } else if (profile.role === "event_organizer" && profile.region) {
      // Event organizer: see all registrations from their region
      recentQuery = recentQuery.eq("user.region", profile.region);
    }

    const { data: recentRegistrations } = await recentQuery;

    // Apply additional filtering for regional admins based on province-to-region mapping
    let filteredRegistrations = recentRegistrations || [];
    if (profile.role === "regional_admin" && profile.region) {
      filteredRegistrations = filteredRegistrations.filter((registration: DatabaseRegistration) => {
        // Include if user is in the same region
        if (registration.user?.region === profile.region) {
          return true;
        }
        // Also include if any registrant has a province that maps to this region
        return registration.registrants?.some((registrant: DatabaseRegistrant) => 
          registrant.province && getRegionFromProvince(registrant.province) === profile.region
        );
      });
    }

    // Get regional breakdown (super admin only)
    let regionalStats = null;
    if (profile.role === "super_admin" || profile.role === "event_organizer") {
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
        regionalStats = Object.entries(regionCounts).map(([region, count]) => ({ region, count }));
      }
    }

    // Compute statistics by province, diocese, and event_role
    const { data: registrantsStatData } = await supabase
      .from("registrants")
      .select(`
        province, 
        diocese, 
        event_role_id,
        event_roles!inner(name)
      `);
      //event_roles!inner(name, event_teams!inner(name))
    const provinceCounts: Record<string, number> = {};
    const dioceseCounts: Record<string, number> = {};
    const roleCounts: Record<string, number> = {};
    const teamCounts: Record<string, number> = {};
    if (registrantsStatData) {
      registrantsStatData.forEach((r) => {
        if (r.province) provinceCounts[r.province] = (provinceCounts[r.province] || 0) + 1;
        if (r.diocese) dioceseCounts[r.diocese] = (dioceseCounts[r.diocese] || 0) + 1;
        // Handle both old and new role structures
        if (r.event_roles && r.event_roles.name) {
          roleCounts[r.event_roles.name] = (roleCounts[r.event_roles.name] || 0) + 1;
        }
      });
    }
    const provinceStats = Object.entries(provinceCounts).map(([province, count]) => ({ province, count }));
    const dioceseStats = Object.entries(dioceseCounts).map(([diocese, count]) => ({ diocese, count }));
    const roleStats = Object.entries(roleCounts).map(([event_role, count]) => ({ event_role, count }));
    const teamStats = Object.entries(teamCounts).map(([team, count]) => ({ team, count }));

    // Add backward compatibility for event_role field
    const processedRegistrations = filteredRegistrations.map((registration) => ({
      ...registration,
      registrants: registration.registrants?.map((registrant: DatabaseRegistrant & { event_roles?: { name: string } }) => ({
        ...registrant,
        // Add backward compatibility event_role field
        event_role: registrant.event_roles?.name || 'participant'
      }))
    }));

    return NextResponse.json({
      stats: {
        totalRegistrations: totalRegistrations.count || 0,
        confirmedRegistrations: confirmedRegistrations.count || 0,
        pendingRegistrations: pendingRegistrations.count || 0,
        totalParticipants: totalParticipants.count || 0,
      },
      recentRegistrations: processedRegistrations,
      regionalStats,
      provinceStats,
      dioceseStats,
      roleStats,
      teamStats,
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
