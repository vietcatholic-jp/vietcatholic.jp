"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function PasswordResetHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have a password reset code on any page
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // If we have a code but we're not on the callback page, redirect to callback
    if (code && !window.location.pathname.includes('/auth/callback')) {
      console.log('Password reset code detected, redirecting to callback...');
      
      // Preserve all URL parameters and redirect to callback
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.search = window.location.search;
      
      router.replace(callbackUrl.toString());
      return;
    }

    // If we have auth errors, redirect to error page
    if (error) {
      console.log('Auth error detected:', error, errorDescription);
      const errorUrl = new URL('/auth/error', window.location.origin);
      errorUrl.searchParams.set('error', errorDescription || error);
      
      router.replace(errorUrl.toString());
      return;
    }
  }, [router, searchParams]);

  return null; // This component doesn't render anything
}
