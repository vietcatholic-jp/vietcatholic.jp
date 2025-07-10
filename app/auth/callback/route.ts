import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if user profile exists, if not create one
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        // Create user profile from OAuth data
        const { error: profileError } = await supabase
          .from("users")
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: data.user.user_metadata?.given_name || data.user.user_metadata?.name?.split(' ')[0] || '',
            last_name: data.user.user_metadata?.family_name || data.user.user_metadata?.name?.split(' ').slice(1).join(' ') || '',
            avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
            role: 'participant', // Default role
            onboarding_completed: false,
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Continue anyway, as the user is authenticated
        }
      }

      // Get the correct base URL for redirect
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

      const redirectUrl = getRedirectUrl();
      return NextResponse.redirect(`${redirectUrl}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?error=Authentication failed`);
}
