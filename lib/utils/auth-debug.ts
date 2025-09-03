import { createClient } from "@/lib/supabase/client";

export interface AuthDebugInfo {
  timestamp: string;
  userAgent: string;
  url: string;
  sessionExists: boolean;
  userId?: string;
  userEmail?: string;
  sessionExpiry?: string;
  error?: string;
  cookies: Record<string, string>;
}

export async function getAuthDebugInfo(url?: string): Promise<AuthDebugInfo> {
  const supabase = createClient();
  const debugInfo: AuthDebugInfo = {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    url: url || (typeof window !== 'undefined' ? window.location.href : 'Unknown'),
    sessionExists: false,
    cookies: {},
  };

  try {
    // Get all cookies
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name) {
          debugInfo.cookies[name] = value || '';
        }
      });
    }

    // Check session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      debugInfo.error = error.message;
    }

    if (session) {
      debugInfo.sessionExists = true;
      debugInfo.userId = session.user.id;
      debugInfo.userEmail = session.user.email;
      debugInfo.sessionExpiry = new Date(session.expires_at! * 1000).toISOString();
    }

    // Also try getUser to see if there's a discrepancy
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError && !debugInfo.error) {
      debugInfo.error = `User check failed: ${userError.message}`;
    }

    if (user && !session) {
      debugInfo.error = 'User exists but no session found';
    }

  } catch (err) {
    debugInfo.error = err instanceof Error ? err.message : 'Unknown error';
  }

  return debugInfo;
}

export function logAuthDebugInfo(debugInfo: AuthDebugInfo) {
  console.group('🔍 Auth Debug Info');
  console.log('Timestamp:', debugInfo.timestamp);
  console.log('URL:', debugInfo.url);
  console.log('User Agent:', debugInfo.userAgent);
  console.log('Session Exists:', debugInfo.sessionExists);
  
  if (debugInfo.userId) {
    console.log('User ID:', debugInfo.userId);
    console.log('User Email:', debugInfo.userEmail);
    console.log('Session Expiry:', debugInfo.sessionExpiry);
  }
  
  if (debugInfo.error) {
    console.error('Error:', debugInfo.error);
  }
  
  console.log('Relevant Cookies:');
  Object.entries(debugInfo.cookies).forEach(([key, value]) => {
    if (key.includes('supabase') || key.includes('auth')) {
      console.log(`  ${key}:`, value ? `${value.substring(0, 20)}...` : 'empty');
    }
  });
  
  console.groupEnd();
}

export async function debugAuthSession(context?: string) {
  const debugInfo = await getAuthDebugInfo();
  if (context) {
    console.log(`🔍 Auth Debug - ${context}`);
  }
  logAuthDebugInfo(debugInfo);
  return debugInfo;
}
