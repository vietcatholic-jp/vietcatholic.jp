import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const allowedRoles = ['super_admin', 'regional_admin', 'event_organizer'];
    if (!allowedRoles.includes(userProfile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get role statistics
    const { data: roleStats, error: statsError } = await supabase
      .from('registrants')
      .select(`
        event_roles:event_role_id(
          id,
          name,
          description
        ),
        registration:registrations!registrants_registration_id_fkey(
          status
        )
      `);

    if (statsError) {
      console.error("Database error:", statsError);
      return NextResponse.json({ error: "Failed to fetch role statistics" }, { status: 500 });
    }

    // Process the data to create statistics
    const roleStatsMap = new Map();

    roleStats.forEach((registrant: {
      event_roles: { id: string; name: string; description: string }[] | null;
      registration: { status: string }[] | null;
    }) => {
      const role = registrant.event_roles?.[0];
      const registration = registrant.registration?.[0];

      // Use role name or "Chưa phân vai trò" for null roles
      const roleName = role?.name || 'Chưa phân vai trò';
      const roleId = role?.id || 'unassigned';
      
      if (!roleStatsMap.has(roleId)) {
        roleStatsMap.set(roleId, {
          role_name: roleName,
          role_label: roleName,
          total_count: 0,
          confirmed_count: 0,
          paid_count: 0,
          pending_count: 0
        });
      }

      const stats = roleStatsMap.get(roleId);
      stats.total_count += 1;

      // Count by registration status
      if (registration?.status === 'confirmed') {
        stats.confirmed_count += 1;
      } else if (registration?.status === 'report_paid' || registration?.status === 'confirm_paid') {
        stats.paid_count += 1;
      } else if (registration?.status === 'pending') {
        stats.pending_count += 1;
      }
    });

    // Convert map to array and sort by total count
    const statistics = Array.from(roleStatsMap.values())
      .sort((a, b) => b.total_count - a.total_count);

    return NextResponse.json({
      success: true,
      data: statistics,
      total_registrants: roleStats.length
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
