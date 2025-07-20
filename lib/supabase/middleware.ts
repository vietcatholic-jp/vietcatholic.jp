import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { Database } from "../types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/guide',
    '/agenda',
    '/auth/login',
    '/auth/sign-up',
    '/auth/confirm',
    '/auth/callback',
    '/auth/error',
    '/auth/forgot-password',
    '/auth/sign-up-success',
    '/auth/update-password',
  ];

  // Protected routes that require authentication
  const protectedRoutes = [
    '/registration-manager',
    '/dashboard',
    '/profile',
    '/register',
    '/admin',
  ];

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    url.pathname = "/auth/login";
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // If user is not authenticated and trying to access non-public route
  if (!user && !isPublicRoute && !isProtectedRoute) {
    url.pathname = "/auth/login";
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated, get their profile for role-based routing
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, region')
      .eq('id', user.id)
      .single();

    // Check role-based access for admin routes
    if (pathname.startsWith('/admin')) {
      if (!profile || !['regional_admin','registration_manager','group_leader', 'event_organizer', 'super_admin'].includes(profile.role)) {
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      // Regional admins can only access their region or general admin
      if (
        profile.role === 'regional_admin' && 
        pathname.startsWith('/admin/super') 
      ) {
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (user && pathname.startsWith('/auth') && pathname !== '/auth/callback') {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Remove the automatic redirect from homepage to dashboard for authenticated users
  // This allows logged-in users to access the home page

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
