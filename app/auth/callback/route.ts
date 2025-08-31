import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type"); // Check if this is a password recovery

  // Helper function to get redirect URL
  const getRedirectUrl = () => {
    // Check for custom site URL environment variable
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    
    // Check for Vercel URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Check forwarded headers (common in production)
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    if (forwardedHost) {
      const protocol = forwardedProto || "https";
      return `${protocol}://${forwardedHost}`;
    }
    
    // Development fallback
    if (process.env.NODE_ENV === "development") {
      return origin;
    }
    
    // Last resort fallback
    return origin;
  };

  if (code) {
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Only redirect to update-password for explicit password recovery flows
      // Check if this is specifically a password recovery flow
      if (type === "recovery") {
        console.log('Detected password reset flow, redirecting to update-password');
        
        // For password recovery, redirect to update-password with session tokens
        const redirectUrl = getRedirectUrl();
        const updatePasswordUrl = new URL("/auth/update-password", redirectUrl);
        
        // Add session tokens to URL for password reset
        if (data.session) {
          updatePasswordUrl.searchParams.set("access_token", data.session.access_token);
          updatePasswordUrl.searchParams.set("refresh_token", data.session.refresh_token);
          updatePasswordUrl.searchParams.set("type", "recovery");
        }
        
        return NextResponse.redirect(updatePasswordUrl.toString());
      }

      console.log('Processing normal login flow');

      // Check if user profile exists, if not create one
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        // Create user profile from OAuth data
        // Construct full name from OAuth data
        const fullName = data.user.user_metadata?.name || `${data.user.user_metadata?.given_name || ''} ${data.user.user_metadata?.family_name || ''}`.trim() ||
                        data.user.email?.split('@')[0] || '';

        const { error: profileError } = await supabase
          .from("users")
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
            role: 'participant', // Default role
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Continue anyway, as the user is authenticated
        }
      }

      const redirectUrl = getRedirectUrl();
      return NextResponse.redirect(`${redirectUrl}${next}`);
    }
  }

  // Return the user to an error page with instructions
  const errorMessage = type === "recovery" ? 
    "Password reset failed - invalid or expired link" : 
    "Authentication failed";
  return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(errorMessage)}`);
}
