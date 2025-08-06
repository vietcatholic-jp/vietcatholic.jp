/**
 * Client-side avatar validation utilities
 * Separated from server-side auth to avoid import issues
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate avatar file on client side
 */
export function validateAvatarFile(file: File): FileValidationResult {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPG, PNG, or WebP images only.',
    };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Please upload images smaller than 5MB.',
    };
  }

  // Check minimum dimensions (will be validated after loading)
  return { valid: true };
}

/**
 * Validate image dimensions after loading
 */
export function validateImageDimensions(
  width: number, 
  height: number
): FileValidationResult {
  const minSize = 100; // Minimum 100x100px
  
  if (width < minSize || height < minSize) {
    return {
      valid: false,
      error: `Image too small. Minimum size is ${minSize}x${minSize} pixels.`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Generate safe filename for avatar
 */
export function generateAvatarFilename(userId: string, registrantId: string): string {
  return `${userId}/${registrantId}-portrait.jpg`;
}