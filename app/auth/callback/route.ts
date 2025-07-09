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

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?error=Authentication failed`);
}
