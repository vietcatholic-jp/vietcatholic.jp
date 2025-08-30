/**
 * Avatar storage service for managing avatar uploads to Supabase Storage
 * Handles upload, delete, and URL generation for registrant avatars
 * Aligned with existing codebase patterns and error handling
 */

import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { AvatarUploadResult, AvatarDeleteResult, AvatarMetadata } from '@/lib/types';

/**
 * Storage configuration for avatars
 */
const STORAGE_CONFIG = {
  bucket: 'portraits',
  maxRetries: 3,
  retryDelay: 1000, // 1 second
} as const;

/**
 * Generate storage path for avatar file
 */
function getAvatarPath(userId: string, registrantId: string): string {
  return `${userId}/${registrantId}-portrait.jpg`;
}

/**
 * Upload avatar to Supabase Storage (client-side)
 * Enhanced with metadata tracking and consistent error handling
 */
export async function uploadAvatar(
  userId: string,
  registrantId: string,
  file: File
): Promise<AvatarUploadResult> {
  try {
    const supabase = createClient();
    const filePath = getAvatarPath(userId, registrantId);

    // Upload file with upsert to replace existing avatar
    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Replace existing file
        contentType: file.type,
      });

    if (error) {
      console.error('Avatar upload error:', error);
      
      // More specific error messages for common issues
      if (error.message?.includes('row-level security')) {
        return {
          success: false,
          error: 'Permission denied: insufficient storage access rights',
        };
      }
      
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .getPublicUrl(filePath);

    // Create metadata following existing patterns
    const metadata: AvatarMetadata = {
      url: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      compressionRatio: 0, // Will be set by compression service
    };

    return {
      success: true,
      avatarUrl: urlData.publicUrl,
      metadata,
    };
  } catch (error) {
    console.error('Avatar upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Upload avatar to Supabase Storage (server-side)
 */
export async function uploadAvatarServer(
  userId: string,
  registrantId: string,
  file: File
): Promise<AvatarUploadResult> {
  try {
    const supabase = await createServerClient();
    const filePath = getAvatarPath(userId, registrantId);

    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload file with upsert to replace existing avatar
    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .upload(filePath, uint8Array, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error('Avatar upload error:', error);
      
      // More specific error messages for common issues
      if (error.message?.includes('row-level security')) {
        return {
          success: false,
          error: 'Permission denied: insufficient storage access rights',
        };
      }
      
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      avatarUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Avatar upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    };
  }
}

/**
 * Delete avatar from Supabase Storage (client-side)
 */
export async function deleteAvatar(
  userId: string,
  registrantId: string
): Promise<AvatarDeleteResult> {
  try {
    const supabase = createClient();
    const filePath = getAvatarPath(userId, registrantId);

    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .remove([filePath]);

    if (error) {
      console.error('Avatar delete error:', error);
      return {
        success: false,
        error: `Delete failed: ${error.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Avatar delete exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error',
    };
  }
}

/**
 * Delete avatar from Supabase Storage (server-side)
 */
export async function deleteAvatarServer(
  userId: string,
  registrantId: string
): Promise<AvatarDeleteResult> {
  try {
    const supabase = await createServerClient();
    const filePath = getAvatarPath(userId, registrantId);

    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .remove([filePath]);

    if (error) {
      console.error('Avatar delete error:', error);
      return {
        success: false,
        error: `Delete failed: ${error.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Avatar delete exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error',
    };
  }
}

/**
 * Get avatar public URL (client-side)
 */
export function getAvatarUrl(userId: string, registrantId: string): string {
  const supabase = createClient();
  const filePath = getAvatarPath(userId, registrantId);

  const { data } = supabase.storage
    .from(STORAGE_CONFIG.bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Get avatar public URL (server-side)
 */
export async function getAvatarUrlServer(userId: string, registrantId: string): Promise<string> {
  const supabase = await createServerClient();
  const filePath = getAvatarPath(userId, registrantId);

  const { data } = supabase.storage
    .from(STORAGE_CONFIG.bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Check if avatar exists in storage (client-side)
 */
export async function avatarExists(
  userId: string,
  registrantId: string
): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .list(userId, {
        search: `${registrantId}-portrait.jpg`,
      });

    if (error) {
      console.error('Avatar exists check error:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Avatar exists check exception:', error);
    return false;
  }
}

/**
 * Check if avatar exists in storage (server-side)
 */
export async function avatarExistsServer(
  userId: string,
  registrantId: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .list(userId, {
        search: `${registrantId}-portrait.jpg`,
      });

    if (error) {
      console.error('Avatar exists check error:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Avatar exists check exception:', error);
    return false;
  }
}

/**
 * Upload avatar with retry logic
 */
export async function uploadAvatarWithRetry(
  userId: string,
  registrantId: string,
  file: File,
  isServer: boolean = false
): Promise<AvatarUploadResult> {
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= STORAGE_CONFIG.maxRetries; attempt++) {
    try {
      const result = isServer 
        ? await uploadAvatarServer(userId, registrantId, file)
        : await uploadAvatar(userId, registrantId, file);

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';
      
      // Don't retry on certain errors
      if (lastError.includes('unauthorized') || lastError.includes('forbidden')) {
        break;
      }

      // Wait before retry (except on last attempt)
      if (attempt < STORAGE_CONFIG.maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, STORAGE_CONFIG.retryDelay * attempt)
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      // Wait before retry (except on last attempt)
      if (attempt < STORAGE_CONFIG.maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, STORAGE_CONFIG.retryDelay * attempt)
        );
      }
    }
  }

  return {
    success: false,
    error: `Upload failed after ${STORAGE_CONFIG.maxRetries} attempts: ${lastError}`,
  };
}

/**
 * Delete avatar with retry logic
 */
export async function deleteAvatarWithRetry(
  userId: string,
  registrantId: string,
  isServer: boolean = false
): Promise<AvatarDeleteResult> {
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= STORAGE_CONFIG.maxRetries; attempt++) {
    try {
      const result = isServer 
        ? await deleteAvatarServer(userId, registrantId)
        : await deleteAvatar(userId, registrantId);

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';
      
      // Don't retry on certain errors
      if (lastError.includes('unauthorized') || lastError.includes('forbidden')) {
        break;
      }

      // Wait before retry (except on last attempt)
      if (attempt < STORAGE_CONFIG.maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, STORAGE_CONFIG.retryDelay * attempt)
        );
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      
      // Wait before retry (except on last attempt)
      if (attempt < STORAGE_CONFIG.maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, STORAGE_CONFIG.retryDelay * attempt)
        );
      }
    }
  }

  return {
    success: false,
    error: `Delete failed after ${STORAGE_CONFIG.maxRetries} attempts: ${lastError}`,
  };
}