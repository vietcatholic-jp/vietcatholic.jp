import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission, getServerUser } from "@/lib/auth";
import { z } from "zod";

const AssignRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  roleId: z.string().uuid("Invalid role ID"),
});

const RemoveRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  roleId: z.string().uuid("Invalid role ID"),
});

// GET /api/admin/user-roles?userId=... - Get user's roles
export async function GET(request: NextRequest) {
  try {
    await requirePermission('users.assign_roles');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        assigned_at,
        assigned_by,
        roles!inner (
          id,
          name,
          description,
          permissions
        ),
        assigner:users!user_roles_assigned_by_fkey (
          full_name,
          email
        )
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user roles:', error);
      return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
    }
    
    const formattedRoles = userRoles?.map(ur => ({
      role: ur.roles,
      assigned_at: ur.assigned_at,
      assigned_by: ur.assigner
    })) || [];
    
    return NextResponse.json({ userRoles: formattedRoles });
  } catch (error) {
    console.error('User roles API error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/user-roles - Assign role to user
export async function POST(request: NextRequest) {
  try {
    await requirePermission('users.assign_roles');
    
    const currentUser = await getServerUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = await createClient();
    const body = await request.json();
    
    const validatedData = AssignRoleSchema.parse(body);
    
    // Check if role assignment already exists
    const { data: existingAssignment } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('user_id', validatedData.userId)
      .eq('role_id', validatedData.roleId)
      .single();
    
    if (existingAssignment) {
      return NextResponse.json({ error: 'Vai trò đã được gán cho người dùng này' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: validatedData.userId,
        role_id: validatedData.roleId,
        assigned_by: currentUser.id
      });
    
    if (error) {
      console.error('Error assigning role:', error);
      return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Assign role API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/user-roles - Remove role from user
export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('users.assign_roles');
    
    const supabase = await createClient();
    const body = await request.json();
    
    const validatedData = RemoveRoleSchema.parse(body);
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', validatedData.userId)
      .eq('role_id', validatedData.roleId);
    
    if (error) {
      console.error('Error removing role:', error);
      return NextResponse.json({ error: 'Failed to remove role' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove role API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}