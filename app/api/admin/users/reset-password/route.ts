import { createClient } from "@/lib/supabase/server";
import { adminResetUserPassword, generateSecurePassword } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    const { userId, generatePassword = true, customPassword } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get the target user to check permissions
    const { data: targetUser } = await supabase
      .from("users")
      .select("id, email, full_name, role, region")
      .eq("id", userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Regional admins can only reset passwords for users in their region (excluding other admins)
    if (profile.role === "regional_admin") {
      if (targetUser.region !== profile.region || 
          ["regional_admin", "super_admin"].includes(targetUser.role)) {
        return NextResponse.json({ 
          error: "You can only reset passwords for non-admin users in your region" 
        }, { status: 403 });
      }
    }

    // Super admins can reset any password except other super admins (unless it's themselves)
    if (profile.role === "super_admin" && targetUser.role === "super_admin" && targetUser.id !== user.id) {
      return NextResponse.json({ 
        error: "Cannot reset password for other super administrators" 
      }, { status: 403 });
    }

    // Generate or use provided password
    const newPassword = generatePassword ? generateSecurePassword(12) : customPassword;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters long" 
      }, { status: 400 });
    }

    // Reset the password using admin client
    await adminResetUserPassword(userId, newPassword);

    // Log the password reset action
    try {
      const { error: logError } = await supabase
        .from("audit_logs")
        .insert({
          user_id: user.id,
          action: "admin_password_reset",
          table_name: "users",
          record_id: userId,
          new_values: {
            target_user: targetUser.email,
            target_user_name: targetUser.full_name,
            reset_by: user.email
          },
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error("Failed to log password reset action:", logError);
        // Don't fail the request if logging fails
      }
    } catch (logError) {
      console.error("Audit logging error:", logError);
      // Continue execution even if audit logging fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "Password reset successfully",
      newPassword: generatePassword ? newPassword : undefined,
      userEmail: targetUser.email,
      userName: targetUser.full_name
    });

  } catch (error) {
    console.error("Password reset API error:", error);
    return NextResponse.json({ 
      error: "Failed to reset password" 
    }, { status: 500 });
  }
}
