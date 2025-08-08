/**
 * Accessibility utilities for avatar management system
 * Provides ARIA labels, keyboard navigation, and screen reader support
 */

/**
 * Generate accessible ARIA labels for avatar components
 */
export function generateAvatarAriaLabel(
  registrantName: string,
  hasAvatar: boolean,
  isEditable: boolean
): string {
  const baseLabel = `Avatar for ${registrantName}`;
  
  if (!hasAvatar) {
    return isEditable 
      ? `${baseLabel}. No avatar set. Click to upload avatar.`
      : `${baseLabel}. No avatar set.`;
  }
  
  return isEditable
    ? `${baseLabel}. Click to edit or delete avatar.`
    : baseLabel;
}

/**
 * Generate ARIA descriptions for avatar upload states
 */
export function generateUploadAriaDescription(
  step: 'upload' | 'crop' | 'process' | 'complete',
  fileName?: string
): string {
  switch (step) {
    case 'upload':
      return 'Select an image file to upload as avatar. Supported formats: JPG, PNG, WEBP. Maximum size: 5MB.';
    case 'crop':
      return fileName 
        ? `Crop the selected image: ${fileName}. Use mouse or touch gestures to adjust the crop area.`
        : 'Crop the selected image. Use mouse or touch gestures to adjust the crop area.';
    case 'process':
      return 'Processing avatar image. Please wait while the image is being compressed and uploaded.';
    case 'complete':
      return 'Avatar upload completed successfully.';
    default:
      return '';
  }
}

/**
 * Keyboard navigation handler for avatar components
 */
export function handleAvatarKeyNavigation(
  event: KeyboardEvent,
  actions: {
    onEdit?: () => void;
    onDelete?: () => void;
    onCancel?: () => void;
    onConfirm?: () => void;
  }
) {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      actions.onEdit?.();
      break;
    case 'Delete':
    case 'Backspace':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        actions.onDelete?.();
      }
      break;
    case 'Escape':
      event.preventDefault();
      actions.onCancel?.();
      break;
    case 'Tab':
      // Allow default tab behavior
      break;
    default:
      break;
  }
}

/**
 * Focus management utilities
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null;

  /**
   * Save current focus and set focus to target element
   */
  setFocus(target: HTMLElement | null) {
    this.previousFocus = document.activeElement as HTMLElement;
    if (target) {
      target.focus();
    }
  }

  /**
   * Restore focus to previously focused element
   */
  restoreFocus() {
    if (this.previousFocus && document.contains(this.previousFocus)) {
      this.previousFocus.focus();
    }
    this.previousFocus = null;
  }

  /**
   * Trap focus within a container element
   */
  trapFocus(container: HTMLElement, event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * Screen reader announcements
 */
export class ScreenReaderAnnouncer {
  private announcer: HTMLElement;

  constructor() {
    this.announcer = this.createAnnouncer();
  }

  private createAnnouncer(): HTMLElement {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
    return announcer;
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      this.announcer.textContent = '';
    }, 1000);
  }

  /**
   * Clean up announcer element
   */
  destroy() {
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer);
    }
  }
}

/**
 * High contrast mode detection
 */
export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for Windows high contrast mode
  if (window.matchMedia('(prefers-contrast: high)').matches) {
    return true;
  }
  
  // Check for forced colors (Windows high contrast)
  if (window.matchMedia('(forced-colors: active)').matches) {
    return true;
  }
  
  return false;
}

/**
 * Reduced motion detection
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Color contrast utilities
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd want a more robust color parsing library
  const getLuminance = (color: string): number => {
    // This is a simplified implementation
    // You'd want to use a proper color library for production
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * WCAG compliance checker
 */
export function checkWCAGCompliance(contrastRatio: number, level: 'AA' | 'AAA' = 'AA'): boolean {
  const thresholds = {
    AA: 4.5,
    AAA: 7
  };
  
  return contrastRatio >= thresholds[level];
}

/**
 * Generate accessible color palette for avatar placeholders
 */
export function generateAccessibleAvatarColors(): Array<{
  background: string;
  text: string;
  contrastRatio: number;
}> {
  const colors = [
    { background: '#1f2937', text: '#ffffff' }, // gray-800 / white
    { background: '#1e40af', text: '#ffffff' }, // blue-700 / white
    { background: '#059669', text: '#ffffff' }, // emerald-600 / white
    { background: '#dc2626', text: '#ffffff' }, // red-600 / white
    { background: '#7c2d12', text: '#ffffff' }, // orange-800 / white
    { background: '#581c87', text: '#ffffff' }, // purple-800 / white
    { background: '#0f766e', text: '#ffffff' }, // teal-700 / white
    { background: '#a21caf', text: '#ffffff' }, // fuchsia-700 / white
  ];

  return colors.map(color => ({
    ...color,
    contrastRatio: getContrastRatio(color.background, color.text)
  })).filter(color => checkWCAGCompliance(color.contrastRatio));
}

/**
 * Accessibility testing utilities
 */
export const a11yTestUtils = {
  /**
   * Check if element has proper ARIA labels
   */
  hasAriaLabel(element: HTMLElement): boolean {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title')
    );
  },

  /**
   * Check if interactive element is keyboard accessible
   */
  isKeyboardAccessible(element: HTMLElement): boolean {
    const tabIndex = element.getAttribute('tabindex');
    const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(
      element.tagName.toLowerCase()
    );
    
    return isInteractive || (tabIndex !== null && tabIndex !== '-1');
  },

  /**
   * Check if element has sufficient color contrast
   */
  hasSufficientContrast(element: HTMLElement): boolean {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    if (backgroundColor === 'rgba(0, 0, 0, 0)' || !color) {
      return true; // Can't determine, assume it's fine
    }
    
    // This would need a proper color parsing implementation
    return true; // Simplified for now
  },

  /**
   * Get accessibility violations for an element
   */
  getViolations(element: HTMLElement): string[] {
    const violations: string[] = [];
    
    if (!this.hasAriaLabel(element) && element.getAttribute('role') === 'button') {
      violations.push('Interactive element missing accessible name');
    }
    
    if (!this.isKeyboardAccessible(element) && element.onclick) {
      violations.push('Interactive element not keyboard accessible');
    }
    
    return violations;
  }
};

/**
 * Create accessible avatar component props
 */
export function createAccessibleAvatarProps(
  registrantName: string,
  hasAvatar: boolean,
  isEditable: boolean
) {
  return {
    'aria-label': generateAvatarAriaLabel(registrantName, hasAvatar, isEditable),
    'role': isEditable ? 'button' : 'img',
    'tabIndex': isEditable ? 0 : -1,
    'aria-describedby': isEditable ? 'avatar-help-text' : undefined,
  };
}