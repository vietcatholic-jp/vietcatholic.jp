import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getMultipleUsersAuthIdentities } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get pagination, search and filter parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || '';
    const regionFilter = searchParams.get('region') || '';

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

    if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build base query for counting total records
    let countQuery = supabase
      .from("users")
      .select("*", { count: 'exact', head: true });

    // Build base query for fetching data
    let usersQuery = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    // Regional admins can only see users in their region
    if (profile.role === "regional_admin") {
      countQuery = countQuery.eq("region", profile.region);
      usersQuery = usersQuery.eq("region", profile.region);
    }

    // Apply search filter if provided
    if (search) {
      const searchFilter = `full_name.ilike.%${search}%,email.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      usersQuery = usersQuery.or(searchFilter);
    }

    // Apply role filter if provided
    if (roleFilter && roleFilter !== 'all') {
      countQuery = countQuery.eq("role", roleFilter);
      usersQuery = usersQuery.eq("role", roleFilter);
    }

    // Apply region filter if provided (only for super_admin)
    if (regionFilter && regionFilter !== 'all' && profile.role === "super_admin") {
      countQuery = countQuery.eq("region", regionFilter);
      usersQuery = usersQuery.eq("region", regionFilter);
    }

    // Get total count first
    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting users:", countError);
      return NextResponse.json({ error: "Failed to count users" }, { status: 500 });
    }

    // Apply pagination to data query
    const offset = (page - 1) * limit;
    usersQuery = usersQuery.range(offset, offset + limit - 1);

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    // Get auth provider information from Supabase Admin API
    const userIds = (users || []).map(user => user.id);
    const authIdentitiesMap = await getMultipleUsersAuthIdentities(userIds);

    const enrichedUsers = (users || []).map(user => {
      const identities = authIdentitiesMap[user.id] || [];

      // Extract provider names from identities
      const providers = identities.length > 0
        ? identities.map(identity => identity.provider)
        : ['email']; // Default fallback if no identities found

      return {
        ...user,
        auth_identities: providers.map(provider => ({ provider }))
      };
    });

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    if (!profile || !["super_admin", "regional_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, role, region } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check permissions for role assignment
    const assignableRoles = profile.role === 'super_admin' 
      ? ['participant', 'event_organizer', 'group_leader', 'regional_admin', 'super_admin']
      : ['participant', 'event_organizer', 'group_leader'];

    if (!assignableRoles.includes(role)) {
      return NextResponse.json({ error: "Cannot assign this role" }, { status: 403 });
    }

    // Check region permissions
    if (profile.role === "regional_admin" && region !== profile.region) {
      return NextResponse.json({ error: "Cannot assign users to other regions" }, { status: 403 });
    }

    // Update user
    const { error: updateError } = await supabase
      .from("users")
      .update({ 
        role,
        region: region || null,
        updated_at: new Date().toISOString() 
      })
      .eq("id", userId);

    if (updateError) {
      console.error("User update error:", updateError);
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "User updated successfully" 
    });

  } catch (error) {
    console.error("Users update API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
