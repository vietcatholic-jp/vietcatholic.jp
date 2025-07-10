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
 * Format: XXX-XXXX-XXXX for mobile, XX-XXXX-XXXX for landline
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

  if (numbersOnly.length === 11 && numbersOnly.startsWith('0')) {
    return true; // 11 digits mobile
  }

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
 * Formats Japanese phone number with proper hyphens
 */
export function formatJapanesePhoneNumber(phone: string): string {
  const cleanedPhone = cleanPhoneNumber(phone);
  const numbersOnly = cleanedPhone.replace(/-/g, '');

  // Mobile numbers (11 digits): XXX-XXXX-XXXX
  if (numbersOnly.length === 11 && numbersOnly.startsWith('0')) {
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7)}`;
  }

  // Landline numbers (10 digits): XX-XXXX-XXXX or XXX-XXX-XXXX
  if (numbersOnly.length === 10 && numbersOnly.startsWith('0')) {
    // For 2-digit area codes (like 03, 06)
    if (numbersOnly.startsWith('03') || numbersOnly.startsWith('06')) {
      return `${numbersOnly.slice(0, 2)}-${numbersOnly.slice(2, 6)}-${numbersOnly.slice(6)}`;
    }
    // For 3-digit area codes
    return `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 6)}-${numbersOnly.slice(6)}`;
  }

  // Return as-is if no pattern matches
  return cleanedPhone;
}

/**
 * Phone number validation error messages in Vietnamese
 */
export const PHONE_VALIDATION_MESSAGES = {
  INVALID_JAPANESE_FORMAT: "Số điện thoại chỉ được chứa số và dấu gạch ngang (-)",
  REQUIRED: "Số điện thoại là bắt buộc"
} as const;
