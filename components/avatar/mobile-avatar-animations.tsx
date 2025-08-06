"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface MobileAnimationWrapperProps {
  children: React.ReactNode;
  className?: string;
  animationType?: 'slide-up' | 'slide-down' | 'fade-in' | 'scale-in' | 'bounce-in';
  duration?: 'fast' | 'normal' | 'slow';
  delay?: number;
}

/**
 * Mobile-optimized animation wrapper
 * Provides smooth animations optimized for touch devices
 */
export function MobileAnimationWrapper({
  children,
  className,
  animationType = 'slide-up',
  duration = 'normal',
  delay = 0,
}: MobileAnimationWrapperProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const animationClasses = {
    'slide-up': {
      initial: 'translate-y-full opacity-0',
      animate: 'translate-y-0 opacity-100',
    },
    'slide-down': {
      initial: '-translate-y-full opacity-0',
      animate: 'translate-y-0 opacity-100',
    },
    'fade-in': {
      initial: 'opacity-0',
      animate: 'opacity-100',
    },
    'scale-in': {
      initial: 'scale-95 opacity-0',
      animate: 'scale-100 opacity-100',
    },
    'bounce-in': {
      initial: 'scale-50 opacity-0',
      animate: 'scale-100 opacity-100',
    },
  };

  const durationClasses = {
    fast: 'duration-200',
    normal: 'duration-300',
    slow: 'duration-500',
  };

  const animation = animationClasses[animationType];
  const durationClass = durationClasses[duration];

  return (
    <div
      className={cn(
        'transition-all ease-out',
        durationClass,
        isVisible ? animation.animate : animation.initial,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Touch feedback button wrapper
 * Provides visual and haptic feedback for mobile interactions
 */
export interface TouchFeedbackButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
  pressScale?: number;
}

export function TouchFeedbackButton({
  children,
  onClick,
  className,
  disabled = false,
  hapticType = 'light',
  pressScale = 0.95,
}: TouchFeedbackButtonProps) {
  const [isPressed, setIsPressed] = React.useState(false);

  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator && !disabled) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[hapticType]);
    }
  };

  const handleTouchStart = () => {
    if (!disabled) {
      setIsPressed(true);
      triggerHapticFeedback();
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (!disabled) {
      onClick?.();
    }
  };

  return (
    <div
      className={cn(
        'transition-transform duration-150 ease-out touch-manipulation',
        isPressed && `scale-[${pressScale}]`,
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

/**
 * Loading spinner optimized for mobile
 */
export interface MobileLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MobileLoadingSpinner({
  size = 'md',
  className,
}: MobileLoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}

/**
 * Progress indicator for mobile workflows
 */
export interface MobileProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function MobileProgressIndicator({
  steps,
  currentStep,
  className,
}: MobileProgressIndicatorProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {steps.map((step, index) => (
        <div
          key={step}
          className={cn(
            'flex items-center gap-2',
            index < steps.length - 1 && 'flex-1'
          )}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
              index < currentStep && 'bg-primary text-primary-foreground',
              index === currentStep && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
              index > currentStep && 'bg-muted text-muted-foreground'
            )}
          >
            {index + 1}
          </div>
          
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 transition-all duration-300',
                index < currentStep ? 'bg-primary' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Swipe gesture detector
 */
export interface SwipeGestureProps {
  children: React.ReactNode;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
}

export function SwipeGesture({
  children,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  className,
}: SwipeGestureProps) {
  const [startTouch, setStartTouch] = React.useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartTouch({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startTouch) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startTouch.x;
    const deltaY = touch.clientY - startTouch.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < threshold) {
      setStartTouch(null);
      return;
    }

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    setStartTouch(null);
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

/**
 * Mobile-optimized CSS animations
 */
export const mobileAnimations = {
  // Sheet animations
  slideUpSheet: 'animate-in slide-in-from-bottom duration-300 ease-out',
  slideDownSheet: 'animate-out slide-out-to-bottom duration-200 ease-in',
  
  // Button press animations
  buttonPress: 'active:scale-95 transition-transform duration-100',
  
  // Loading animations
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce',
  
  // Fade animations
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-200',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-300',
  scaleOut: 'animate-out zoom-out-95 duration-200',
};