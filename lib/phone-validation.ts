/**
 * Utility functions for Japanese phone number validation
 */

/**
 * Cleans phone number by removing all whitespace and keeping only numbers and hyphens
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\s+/g, '').trim();
}

/**
 * Validates Japanese phone number format - simplified version
 * Accepts any mobile (11 digits) and landline (10 digits) numbers starting with 0
 */
export function isValidJapanesePhoneNumber(phone: string): boolean {
  // Clean the phone number first
  const cleanedPhone = cleanPhoneNumber(phone);
  
  // Check if it contains only numbers and hyphens
  if (!/^[0-9-]+$/.test(cleanedPhone)) {
    return false;
  }
  
  // Remove hyphens to check the number format
  const numbersOnly = cleanedPhone.replace(/-/g, '');
  
  // Simple validation with basic mobile/landline distinction:
  // Mobile prefixes (070, 080, 090, etc.) must be 11 digits
  // Landline prefixes must be 10 digits
  
  // Check for 11-digit mobile numbers
  if (numbersOnly.length === 11 && numbersOnly.startsWith('0')) {
    return true; // 11 digits mobile
  }

  // Check for 10-digit landline numbers
  if (numbersOnly.length === 10 && numbersOnly.startsWith('0')) {
    // Make sure it's not a truncated mobile number
    if (numbersOnly.startsWith('070') || numbersOnly.startsWith('080') || numbersOnly.startsWith('090')) {
      return false; // Mobile numbers must be 11 digits
    }
    return true; // 10 digits landline
  }
  
  return false;
}

/**
 * Phone number validation error messages in Vietnamese
 */
export const PHONE_VALIDATION_MESSAGES = {
  INVALID_JAPANESE_FORMAT: "Số điện thoại không đúng định dạng Nhật Bản",
  REQUIRED: "Số điện thoại là bắt buộc"
} as const;
