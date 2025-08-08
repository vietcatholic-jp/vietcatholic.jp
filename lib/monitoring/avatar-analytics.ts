/**
 * Avatar management analytics and monitoring
 * Tracks usage, performance, and errors for the avatar system
 */

import { PerformanceMonitor } from '@/lib/utils/performance';

export interface AvatarAnalyticsEvent {
  event: string;
  userId: string;
  registrantId: string;
  timestamp: number;
  properties?: Record<string, unknown>;
}

export interface AvatarPerformanceMetrics {
  uploadDuration: number;
  compressionRatio: number;
  fileSize: {
    original: number;
    compressed: number;
  };
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionType: string;
}

export interface AvatarErrorEvent {
  error: string;
  errorType: 'upload' | 'compression' | 'permission' | 'network' | 'validation';
  userId: string;
  registrantId?: string;
  context: Record<string, unknown>;
  timestamp: number;
}

/**
 * Avatar analytics service
 */
export class AvatarAnalytics {
  private static instance: AvatarAnalytics;
  private performanceMonitor: PerformanceMonitor;
  private events: AvatarAnalyticsEvent[] = [];
  private errors: AvatarErrorEvent[] = [];

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
  }

  static getInstance(): AvatarAnalytics {
    if (!AvatarAnalytics.instance) {
      AvatarAnalytics.instance = new AvatarAnalytics();
    }
    return AvatarAnalytics.instance;
  }

  /**
   * Track avatar upload started
   */
  trackUploadStarted(
    userId: string,
    registrantId: string,
    fileSize: number,
    fileType: string,
    deviceType: 'mobile' | 'tablet' | 'desktop'
  ) {
    this.performanceMonitor.startTiming(`avatar-upload-${registrantId}`);
    
    this.trackEvent('avatar_upload_started', userId, registrantId, {
      fileSize,
      fileType,
      deviceType,
      timestamp: Date.now(),
    });
  }

  /**
   * Track avatar upload completed
   */
  trackUploadCompleted(
    userId: string,
    registrantId: string,
    metrics: AvatarPerformanceMetrics
  ) {
    const duration = this.performanceMonitor.endTiming(`avatar-upload-${registrantId}`);
    
    this.trackEvent('avatar_upload_completed', userId, registrantId, {
      ...metrics,
      uploadDuration: duration,
      timestamp: Date.now(),
    });

    // Track performance metrics
    this.trackPerformanceMetric('upload_duration', duration);
    this.trackPerformanceMetric('compression_ratio', metrics.compressionRatio);
    this.trackPerformanceMetric('file_size_reduction', 
      metrics.fileSize.original - metrics.fileSize.compressed
    );
  }

  /**
   * Track avatar upload failed
   */
  trackUploadFailed(
    userId: string,
    registrantId: string,
    error: string,
    errorType: AvatarErrorEvent['errorType'],
    context: Record<string, unknown> = {}
  ) {
    this.performanceMonitor.endTiming(`avatar-upload-${registrantId}`);
    
    this.trackError({
      error,
      errorType,
      userId,
      registrantId,
      context,
      timestamp: Date.now(),
    });

    this.trackEvent('avatar_upload_failed', userId, registrantId, {
      error,
      errorType,
      context,
      timestamp: Date.now(),
    });
  }

  /**
   * Track avatar deletion
   */
  trackAvatarDeleted(
    userId: string,
    registrantId: string,
    isAdminAction: boolean = false
  ) {
    this.trackEvent('avatar_deleted', userId, registrantId, {
      isAdminAction,
      timestamp: Date.now(),
    });
  }

  /**
   * Track avatar view/display
   */
  trackAvatarViewed(
    userId: string,
    registrantId: string,
    context: 'list' | 'detail' | 'ticket' | 'admin'
  ) {
    this.trackEvent('avatar_viewed', userId, registrantId, {
      context,
      timestamp: Date.now(),
    });
  }

  /**
   * Track crop tool usage
   */
  trackCropToolUsed(
    userId: string,
    registrantId: string,
    deviceType: 'mobile' | 'tablet' | 'desktop',
    cropDuration: number
  ) {
    this.trackEvent('avatar_crop_used', userId, registrantId, {
      deviceType,
      cropDuration,
      timestamp: Date.now(),
    });
  }

  /**
   * Track user adoption metrics
   */
  trackUserAdoption(
    userId: string,
    userRole: string,
    hasUploadedAvatar: boolean,
    registrantCount: number
  ) {
    this.trackEvent('user_adoption', userId, '', {
      userRole,
      hasUploadedAvatar,
      registrantCount,
      adoptionRate: hasUploadedAvatar ? 1 : 0,
      timestamp: Date.now(),
    });
  }

  /**
   * Track device and browser usage
   */
  trackDeviceUsage(
    userId: string,
    deviceInfo: {
      deviceType: 'mobile' | 'tablet' | 'desktop';
      browser: string;
      os: string;
      screenSize: string;
      touchSupport: boolean;
    }
  ) {
    this.trackEvent('device_usage', userId, '', {
      ...deviceInfo,
      timestamp: Date.now(),
    });
  }

  /**
   * Track performance issues
   */
  trackPerformanceIssue(
    type: 'slow_upload' | 'large_file' | 'compression_failure' | 'memory_usage',
    userId: string,
    registrantId: string,
    details: Record<string, unknown>
  ) {
    this.trackEvent('performance_issue', userId, registrantId, {
      type,
      details,
      timestamp: Date.now(),
    });
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    totalEvents: number;
    totalErrors: number;
    uploadSuccessRate: number;
    uploadFailureRate: number;
    averageUploadTime: number;
    averageCompressionRatio: number;
    deviceBreakdown: Record<string, number>;
    errorBreakdown: Record<string, number>;
  } {
    const uploadStarted = this.events.filter(e => e.event === 'avatar_upload_started').length;
    const uploadCompleted = this.events.filter(e => e.event === 'avatar_upload_completed').length;
    const uploadFailed = this.events.filter(e => e.event === 'avatar_upload_failed').length;

    const successRate = uploadStarted > 0 ? (uploadCompleted / uploadStarted) * 100 : 0;
    const failureRate = uploadStarted > 0 ? (uploadFailed / uploadStarted) * 100 : 0;

    const completedUploads = this.events.filter(e => e.event === 'avatar_upload_completed');
    const averageUploadTime = completedUploads.length > 0
      ? completedUploads.reduce((sum, e) => {
          const duration = e.properties?.uploadDuration;
          return sum + (typeof duration === 'number' ? duration : 0);
        }, 0) / completedUploads.length
      : 0;

    const averageCompressionRatio = completedUploads.length > 0
      ? completedUploads.reduce((sum, e) => {
          const ratio = e.properties?.compressionRatio;
          return sum + (typeof ratio === 'number' ? ratio : 0);
        }, 0) / completedUploads.length
      : 0;

    const deviceBreakdown: Record<string, number> = {};
    this.events.forEach(event => {
      const device = typeof event.properties?.deviceType === 'string' ? event.properties.deviceType : 'unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });

    const errorBreakdown: Record<string, number> = {};
    this.errors.forEach(error => {
      errorBreakdown[error.errorType] = (errorBreakdown[error.errorType] || 0) + 1;
    });

    return {
      totalEvents: this.events.length,
      totalErrors: this.errors.length,
      uploadSuccessRate: successRate,
      uploadFailureRate: failureRate,
      averageUploadTime,
      averageCompressionRatio,
      deviceBreakdown,
      errorBreakdown,
    };
  }

  /**
   * Export analytics data
   */
  exportAnalyticsData(): {
    events: AvatarAnalyticsEvent[];
    errors: AvatarErrorEvent[];
    performanceMetrics: Record<string, { average: number; count: number }>;
  } {
    return {
      events: [...this.events],
      errors: [...this.errors],
      performanceMetrics: this.performanceMonitor.getMetrics(),
    };
  }

  /**
   * Clear analytics data
   */
  clearAnalyticsData() {
    this.events = [];
    this.errors = [];
    this.performanceMonitor.clearMetrics();
  }

  /**
   * Private method to track events
   */
  private trackEvent(
    event: string,
    userId: string,
    registrantId: string,
    properties?: Record<string, unknown>
  ) {
    const analyticsEvent: AvatarAnalyticsEvent = {
      event,
      userId,
      registrantId,
      timestamp: Date.now(),
      properties,
    };

    this.events.push(analyticsEvent);

    // Send to external analytics service if configured
    this.sendToExternalAnalytics(analyticsEvent);
  }

  /**
   * Private method to track errors
   */
  private trackError(error: AvatarErrorEvent) {
    this.errors.push(error);

    // Send to error tracking service if configured
    this.sendToErrorTracking(error);
  }

  /**
   * Private method to track performance metrics
   */
  private trackPerformanceMetric(metric: string, value: number) {
    // This could be sent to a performance monitoring service
    console.debug(`Avatar Performance Metric: ${metric} = ${value}`);
  }

  /**
   * Send to external analytics service (e.g., Google Analytics, Mixpanel)
   */
  private sendToExternalAnalytics(event: AvatarAnalyticsEvent) {
    // Example: Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as { gtag: (...args: unknown[]) => void }).gtag('event', event.event, {
        custom_parameter_user_id: event.userId,
        custom_parameter_registrant_id: event.registrantId,
        ...event.properties,
      });
    }

    // Example: Mixpanel
    if (typeof window !== 'undefined' && 'mixpanel' in window) {
      (window as { mixpanel: { track: (event: string, properties: Record<string, unknown>) => void } }).mixpanel.track(event.event, {
        userId: event.userId,
        registrantId: event.registrantId,
        ...event.properties,
      });
    }
  }

  /**
   * Send to error tracking service (e.g., Sentry)
   */
  private sendToErrorTracking(error: AvatarErrorEvent) {
    // Example: Sentry
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      (window as { Sentry: { captureException: (error: Error, options: Record<string, unknown>) => void } }).Sentry.captureException(new Error(error.error), {
        tags: {
          feature: 'avatar-management',
          errorType: error.errorType,
        },
        user: {
          id: error.userId,
        },
        extra: {
          registrantId: error.registrantId,
          context: error.context,
        },
      });
    }
  }
}

/**
 * Convenience functions for common tracking scenarios
 */
export const avatarAnalytics = AvatarAnalytics.getInstance();

export const trackAvatarUpload = {
  started: (userId: string, registrantId: string, file: File, deviceType: 'mobile' | 'tablet' | 'desktop') => {
    avatarAnalytics.trackUploadStarted(userId, registrantId, file.size, file.type, deviceType);
  },
  
  completed: (userId: string, registrantId: string, metrics: AvatarPerformanceMetrics) => {
    avatarAnalytics.trackUploadCompleted(userId, registrantId, metrics);
  },
  
  failed: (userId: string, registrantId: string, error: string, errorType: AvatarErrorEvent['errorType'], context?: Record<string, unknown>) => {
    avatarAnalytics.trackUploadFailed(userId, registrantId, error, errorType, context);
  },
};

export const trackAvatarUsage = {
  viewed: (userId: string, registrantId: string, context: 'list' | 'detail' | 'ticket' | 'admin') => {
    avatarAnalytics.trackAvatarViewed(userId, registrantId, context);
  },
  
  deleted: (userId: string, registrantId: string, isAdminAction: boolean = false) => {
    avatarAnalytics.trackAvatarDeleted(userId, registrantId, isAdminAction);
  },
  
  cropped: (userId: string, registrantId: string, deviceType: 'mobile' | 'tablet' | 'desktop', duration: number) => {
    avatarAnalytics.trackCropToolUsed(userId, registrantId, deviceType, duration);
  },
};