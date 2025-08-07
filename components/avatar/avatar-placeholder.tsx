"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface AvatarPlaceholderProps {
  initials: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Avatar placeholder component that displays user initials
 * Uses consistent color scheme based on name hash
 */
export function AvatarPlaceholder({
  initials,
  className,
  size = 'md',
}: AvatarPlaceholderProps) {
  const displayInitials = generateInitials(initials);
  const colorScheme = getColorScheme(initials);
  const textSize = getTextSize(size);

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium select-none',
        colorScheme,
        textSize,
        className
      )}
      aria-label={`Avatar placeholder for ${initials}`}
    >
      {displayInitials}
    </div>
  );
}

/**
 * Generate initials from full name
 * Takes first letter of first name and first letter of last name
 */
function generateInitials(fullName: string): string {
  if (!fullName || fullName.trim().length === 0) {
    return '?';
  }

  const names = fullName.trim().split(/\s+/);
  
  if (names.length === 1) {
    // Single name - take first two characters
    return names[0].substring(0, 2).toUpperCase();
  }
  
  // Multiple names - take first letter of first and last name
  const firstName = names[0];
  const lastName = names[names.length - 1];
  
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

/**
 * Get consistent color scheme based on name hash
 * Uses a predefined set of pleasant color combinations
 */
function getColorScheme(name: string): string {
  const colorSchemes = [
    'bg-blue-500 text-white',
    'bg-green-500 text-white',
    'bg-purple-500 text-white',
    'bg-orange-500 text-white',
    'bg-pink-500 text-white',
    'bg-indigo-500 text-white',
    'bg-teal-500 text-white',
    'bg-red-500 text-white',
    'bg-yellow-500 text-black',
    'bg-cyan-500 text-white',
    'bg-emerald-500 text-white',
    'bg-violet-500 text-white',
    'bg-rose-500 text-white',
    'bg-sky-500 text-white',
    'bg-amber-500 text-black',
    'bg-lime-500 text-black',
  ];

  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % colorSchemes.length;
  return colorSchemes[index];
}

/**
 * Get text size class based on avatar size
 */
function getTextSize(size: 'sm' | 'md' | 'lg'): string {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
  };
  
  return textSizes[size];
}