import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { z } from "zod";

const CreateRoleSchema = z.object({
  name: z.string().min(1, "Tên vai trò là bắt buộc"),
  description: z.string().optional(),
  permissions: z.record(z.boolean()).default({}),
});

const UpdateRoleSchema = z.object({
  name: z.string().min(1, "Tên vai trò là bắt buộc").optional(),
  description: z.string().optional(),
  permissions: z.record(z.boolean()).optional(),
});

// GET /api/admin/system-roles - Get all system roles
export async function GET() {
  try {
    await requirePermission('roles.*');
    
    const supabase = await createClient();
    
    const { data: roles, error } = await supabase
      .from('roles')
      .select(`
        *,
        user_count:user_roles(count)
      `)
      .order('name');
    
    if (error) {
      console.error('Error fetching roles:', error);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }
    
    // Format the roles with user count
    const formattedRoles = roles?.map(role => ({
      ...role,
      user_count: role.user_count?.length || 0
    })) || [];
    
    return NextResponse.json({ roles: formattedRoles });
  } catch (error) {
    console.error('System roles API error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/system-roles - Create new role
export async function POST(request: NextRequest) {
  try {
    await requirePermission('roles.*');
    
    const supabase = await createClient();
    const body = await request.json();
    
    const validatedData = CreateRoleSchema.parse(body);
    
    const { data, error } = await supabase
      .from('roles')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        permissions: validatedData.permissions,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating role:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Vai trò đã tồn tại' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
    }
    
    return NextResponse.json({ role: { ...data, user_count: 0 } }, { status: 201 });
  } catch (error) {
    console.error('Create system role API error:', error);
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

// PUT /api/admin/system-roles - Update role
export async function PUT(request: NextRequest) {
  try {
    await requirePermission('roles.*');
    
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }
    
    const validatedData = UpdateRoleSchema.parse(updateData);
    
    const { data, error } = await supabase
      .from('roles')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating role:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Tên vai trò đã tồn tại' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }
    
    // Get user count
    const { count: userCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', id);
    
    return NextResponse.json({ role: { ...data, user_count: userCount || 0 } });
  } catch (error) {
    console.error('Update system role API error:', error);
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

// DELETE /api/admin/system-roles - Delete role
export async function DELETE(request: NextRequest) {
  try {
    await requirePermission('roles.*');
    
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }
    
    // Check if role is assigned to any users
    const { data: assignments, error: checkError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_id', id)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking role assignments:', checkError);
      return NextResponse.json({ error: 'Failed to check role assignments' }, { status: 500 });
    }
    
    if (assignments && assignments.length > 0) {
      return NextResponse.json({ 
        error: 'Không thể xóa vai trò đã được gán cho người dùng' 
      }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting role:', error);
      return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete system role API error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}