"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  useIntersectionObserver,
  useImagePreloader
} from '@/lib/utils/performance';

export interface AvatarImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized avatar image component with lazy loading and error handling
 * Uses Next.js Image optimization and Intersection Observer for lazy loading
 */
const AvatarImageComponent = function AvatarImage({
  src,
  alt,
  className,
  priority = false,
  onLoad,
  onError,
}: AvatarImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Use optimized intersection observer
  const [intersectionRef, isInView] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  // Preload image for better UX
  useImagePreloader(src);

  // Combine refs
  useEffect(() => {
    if (imgRef.current && intersectionRef.current !== imgRef.current) {
      (intersectionRef as React.MutableRefObject<HTMLDivElement | null>).current = imgRef.current;
    }
  }, [intersectionRef]);

  const shouldLoad = priority || isInView;

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className={cn('relative', className)}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-full" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-muted rounded-full flex items-center justify-center">
          <BrokenImageIcon className="w-1/3 h-1/3 text-muted-foreground" />
        </div>
      )}

      {/* Actual image */}
      {shouldLoad && !hasError && (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            'object-cover rounded-full transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          sizes="(max-width: 768px) 96px, 120px"
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+Wj7z4a"
        />
      )}

      {/* Blur placeholder for progressive loading */}
      {!priority && isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 rounded-full" />
      )}
    </div>
  );
};

// Export memoized component for performance
export const AvatarImage = React.memo(AvatarImageComponent);

/**
 * Broken image icon component
 */
function BrokenImageIcon({ className }: { className?: string }) {
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
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 4l16 16"
      />
    </svg>
  );
}

/**
 * Hook for preloading avatar images
 */
export function useAvatarPreload(src: string) {
  useEffect(() => {
    if (!src) return;

    const img = new window.Image();
    img.src = src;
  }, [src]);
}

/**
 * Utility function to generate blur data URL for progressive loading
 */
export function generateBlurDataURL(width: number = 40, height: number = 40): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Create a simple gradient blur placeholder
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 2
  );
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}