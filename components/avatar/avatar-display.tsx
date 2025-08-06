"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { AvatarSize } from '@/lib/types';
import { useBreakpoint, useResponsiveValue } from '@/lib/utils/responsive';
import { createAccessibleAvatarProps, handleAvatarKeyNavigation } from '@/lib/utils/accessibility';
import { AvatarImage } from './avatar-image';
import { AvatarPlaceholder } from './avatar-placeholder';

export interface AvatarDisplayProps {
  src?: string;
  alt: string;
  size?: AvatarSize;
  fallbackInitials: string;
  className?: string;
  responsive?: boolean;
  editable?: boolean;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  loading?: boolean;
}

/**
 * Responsive avatar display component with fallback placeholder
 * Supports different sizes and responsive behavior
 */
export function AvatarDisplay({
  src,
  alt,
  size = 'md',
  fallbackInitials,
  className,
  responsive = true,
  editable = false,
  onEditClick,
  onDeleteClick,
  loading = false,
}: AvatarDisplayProps) {
  const { isMobile } = useBreakpoint();
  
  // Get responsive size values
  const avatarSize = useResponsiveValue({
    mobile: getSizePixels(size, 'mobile'),
    desktop: getSizePixels(size, 'desktop'),
  });

  const sizeClasses = getSizeClasses(size, responsive ? (isMobile ? 'mobile' : 'desktop') : 'desktop');

  // Generate accessible props
  const accessibleProps = createAccessibleAvatarProps(
    alt.replace('Avatar for ', ''),
    !!src,
    editable
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editable) return;
    
    handleAvatarKeyNavigation(e.nativeEvent, {
      onEdit: onEditClick,
      onDelete: onDeleteClick,
    });
  };

  return (
    <div className={cn('relative group', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-full bg-muted transition-all duration-200',
          sizeClasses,
          editable && !isMobile && 'hover:scale-105 hover:shadow-lg cursor-pointer',
          editable && isMobile && 'active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
        )}
        style={{
          width: responsive ? avatarSize : undefined,
          height: responsive ? avatarSize : undefined,
        }}
        onClick={editable ? onEditClick : undefined}
        onKeyDown={handleKeyDown}
        {...accessibleProps}
      >
        {loading ? (
          <AvatarSkeleton />
        ) : src ? (
          <AvatarImage
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <AvatarPlaceholder
            initials={fallbackInitials}
            className="w-full h-full"
          />
        )}

        {/* Desktop hover overlay */}
        {editable && !isMobile && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="flex gap-1">
              {onEditClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick();
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-full transition-colors"
                  aria-label="Edit avatar"
                >
                  <EditIcon className="w-3 h-3 text-gray-700" />
                </button>
              )}
              {onDeleteClick && src && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick();
                  }}
                  className="p-1.5 bg-white/90 hover:bg-white rounded-full transition-colors"
                  aria-label="Delete avatar"
                >
                  <DeleteIcon className="w-3 h-3 text-red-600" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile edit indicator */}
      {editable && isMobile && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
          <EditIcon className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

/**
 * Avatar skeleton loader
 */
function AvatarSkeleton() {
  return (
    <div className="w-full h-full bg-muted animate-pulse rounded-full" />
  );
}

/**
 * Edit icon component
 */
function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

/**
 * Delete icon component
 */
function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

/**
 * Get pixel size for avatar based on size and device
 */
function getSizePixels(size: AvatarSize, device: 'mobile' | 'desktop'): number {
  const sizes = {
    sm: { mobile: 32, desktop: 40 },
    md: { mobile: 64, desktop: 80 },
    lg: { mobile: 96, desktop: 120 },
    xl: { mobile: 128, desktop: 160 },
  };

  return sizes[size][device];
}

/**
 * Get CSS classes for avatar size
 */
function getSizeClasses(size: AvatarSize, device: 'mobile' | 'desktop'): string {
  const classes = {
    sm: {
      mobile: 'w-8 h-8',
      desktop: 'w-10 h-10',
    },
    md: {
      mobile: 'w-16 h-16',
      desktop: 'w-20 h-20',
    },
    lg: {
      mobile: 'w-24 h-24',
      desktop: 'w-30 h-30',
    },
    xl: {
      mobile: 'w-32 h-32',
      desktop: 'w-40 h-40',
    },
  };

  return classes[size][device];
}