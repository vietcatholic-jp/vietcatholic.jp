/**
 * Authentication utilities for avatar API endpoints
 * Handles auth checking, permission validation, and logging
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PermissionService } from './permission';
import { EventLogger } from '@/lib/logging/event-logger';
import { UserRole } from '@/lib/types';

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  error?: string;
  statusCode?: number;
}

export interface PermissionCheckResult extends AuthResult {
  isAdmin?: boolean;
  registrantOwner?: string;
}

/**
 * Authenticate user from request
 * Note: request parameter reserved for future use (e.g., IP validation, headers)
 */
export async function authenticateRequest(): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized - Invalid or missing authentication',
        statusCode: 401
      };
    }

    // Get user profile for role information
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Unauthorized - User profile not found',
        statusCode: 401
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email || '',
        role: profile.role
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      statusCode: 500
    };
  }
}

/**
 * Check if user has permission to manage registrant avatar
 */
export async function checkAvatarPermission(
  userId: string,
  userRole: UserRole,
  registrantId: string
): Promise<PermissionCheckResult> {
  try {
    // Validate registrant exists
    const registrant = await PermissionService.validateRegistrant(registrantId, true);
    if (!registrant) {
      return {
        success: false,
        error: 'Registrant not found',
        statusCode: 404
      };
    }

    // Check permission
    const permissionResult = await PermissionService.canManageAvatarServer(userId, registrantId);
    
    if (!permissionResult.allowed) {
      return {
        success: false,
        error: permissionResult.reason || 'Access denied',
        statusCode: 403
      };
    }

    // Get additional info for logging
    const isAdmin = PermissionService.isAdmin(userRole);
    const registrantOwner = isAdmin ? await PermissionService.getRegistrantOwnerServer(registrantId) : userId;

    return {
      success: true,
      isAdmin,
      registrantOwner: registrantOwner || undefined,
      user: {
        id: userId,
        email: '', // Will be filled by caller if needed
        role: userRole
      }
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return {
      success: false,
      error: 'Permission check failed',
      statusCode: 500
    };
  }
}

/**
 * Combined authentication and permission check
 */
export async function authenticateAndAuthorize(
  request: NextRequest,
  registrantId: string
): Promise<PermissionCheckResult> {
  // First authenticate the user
  const authResult = await authenticateRequest();
  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  // Then check permissions
  const permissionResult = await checkAvatarPermission(
    authResult.user.id,
    authResult.user.role,
    registrantId
  );

  if (!permissionResult.success) {
    return permissionResult;
  }

  // Combine results
  return {
    ...permissionResult,
    user: authResult.user
  };
}

/**
 * Log avatar management action
 */
export async function logAvatarAction(
  action: 'avatar_uploaded' | 'avatar_updated' | 'avatar_deleted',
  userId: string,
  userEmail: string,
  userRole: UserRole,
  registrantId: string,
  metadata?: {
    file_size?: number;
    file_type?: string;
    admin_action?: boolean;
    registrant_owner?: string;
    compression_ratio?: number;
    original_size?: number;
  }
) {
  try {
    const logger = new EventLogger();
    await logger.logInfo(action, 'avatar_management', {
      userId,
      userEmail,
      userRole,
      eventData: {
        registrant_id: registrantId,
        ...metadata
      }
    });
  } catch (error) {
    console.error('Failed to log avatar action:', error);
    // Don't throw - logging failure shouldn't break the main operation
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 400,
  details?: unknown
) {
  return Response.json(
    {
      success: false,
      error: message,
      details
    },
    { status: statusCode }
  );
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(data: Record<string, unknown>, statusCode: number = 200) {
  return Response.json(
    {
      success: true,
      ...data
    },
    { status: statusCode }
  );
}

/**
 * Validate file upload for avatar
 */
export function validateAvatarFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File must be an image (JPG, PNG, WEBP)'
    };
  }

  // Check supported formats
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Unsupported image format. Please use JPG, PNG, or WEBP'
    };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB'
    };
  }

  // Check minimum file size (1KB to avoid empty files)
  if (file.size < 1024) {
    return {
      valid: false,
      error: 'File too small. Minimum size is 1KB'
    };
  }

  return { valid: true };
}

/**
 * Extract registrant ID from URL path
 */
export function extractRegistrantId(pathname: string): string | null {
  const match = pathname.match(/\/api\/registrants\/([^\/]+)\/avatar/);
  return match ? match[1] : null;
}

/**
 * Rate limiting check (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  userId: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `avatar_${userId}`;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    const resetTime = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime
    };
  }
  
  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }
  
  // Increment count
  current.count++;
  rateLimitMap.set(key, current);
  
  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime
  };
}