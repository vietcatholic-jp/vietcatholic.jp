# Registration Flow Logging System - Implementation Plan

## Overview

This document outlines the implementation plan for a comprehensive logging system focused on the registration flow to capture critical events, errors, and user actions for debugging and monitoring purposes.

## 1. Database Schema Design

### 1.1 Event Logs Table

```sql
CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event Classification
  event_type VARCHAR(50) NOT NULL, -- 'registration_created', 'payment_uploaded', 'validation_error', etc.
  event_category VARCHAR(30) NOT NULL, -- 'registration', 'payment', 'cancellation', 'admin'
  severity VARCHAR(20) NOT NULL DEFAULT 'info', -- 'debug', 'info', 'warning', 'error', 'critical'
  
  -- User Context
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255), -- Denormalized for easier querying
  user_role VARCHAR(50), -- Captured at time of event
  user_agent TEXT, -- Browser/device information
  ip_address INET, -- For tracking location/patterns
  
  -- Request Context
  request_id VARCHAR(100), -- Unique identifier for tracking request flow
  endpoint VARCHAR(200), -- API endpoint or page URL
  http_method VARCHAR(10), -- GET, POST, PUT, etc.
  session_id VARCHAR(100), -- User session identifier
  
  -- Event Data
  event_data JSONB NOT NULL DEFAULT '{}', -- Flexible event-specific data
  error_details JSONB, -- Stack trace, error message, validation errors
  
  -- Registration Context (when applicable)
  registration_id UUID REFERENCES registrations(id),
  invoice_code VARCHAR(20), -- For easier correlation
  registrant_count INTEGER, -- Number of registrants in registration
  
  -- Performance Metrics
  duration_ms INTEGER, -- Operation duration for performance monitoring
  memory_usage_mb DECIMAL(10,2), -- Memory usage if available
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}', -- For flexible categorization ['urgent', 'payment_issue', etc.]
  correlation_id VARCHAR(100), -- For tracking related events across services
  
  -- Indexes
  CONSTRAINT event_logs_event_type_check CHECK (event_type ~ '^[a-z_]+$'),
  CONSTRAINT event_logs_severity_check CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
);

-- Indexes for performance
CREATE INDEX idx_event_logs_event_type ON event_logs(event_type);
CREATE INDEX idx_event_logs_user_id ON event_logs(user_id);
CREATE INDEX idx_event_logs_registration_id ON event_logs(registration_id);
CREATE INDEX idx_event_logs_created_at ON event_logs(created_at DESC);
CREATE INDEX idx_event_logs_severity ON event_logs(severity);
CREATE INDEX idx_event_logs_category_created ON event_logs(event_category, created_at DESC);
CREATE INDEX idx_event_logs_request_id ON event_logs(request_id);
CREATE INDEX idx_event_logs_correlation_id ON event_logs(correlation_id);
CREATE INDEX idx_event_logs_invoice_code ON event_logs(invoice_code);

-- Partial index for errors only (most commonly queried)
CREATE INDEX idx_event_logs_errors ON event_logs(created_at DESC, event_type) 
  WHERE severity IN ('error', 'critical');

-- JSONB indexes for common queries
CREATE INDEX idx_event_logs_event_data_gin ON event_logs USING GIN(event_data);
CREATE INDEX idx_event_logs_error_details_gin ON event_logs USING GIN(error_details);
```

### 1.2 Event Types Classification

```typescript
// Event Types for Registration Flow
export const REGISTRATION_EVENT_TYPES = {
  // Registration Creation
  REGISTRATION_STARTED: 'registration_started',
  REGISTRATION_CREATED: 'registration_created',
  REGISTRATION_FAILED: 'registration_failed',
  REGISTRANT_VALIDATION_ERROR: 'registrant_validation_error',
  INVOICE_GENERATION_ERROR: 'invoice_generation_error',
  
  // Registration Updates
  REGISTRATION_UPDATED: 'registration_updated',
  REGISTRATION_UPDATE_FAILED: 'registration_update_failed',
  REGISTRANT_DELETED: 'registrant_deleted',
  REGISTRANT_CREATED: 'registrant_created',
  
  // Payment Flow
  PAYMENT_RECEIPT_UPLOADED: 'payment_receipt_uploaded',
  PAYMENT_RECEIPT_FAILED: 'payment_receipt_failed',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_REJECTED: 'payment_rejected',
  PAYMENT_VALIDATION_ERROR: 'payment_validation_error',
  
  // Cancellation Flow
  CANCELLATION_REQUESTED: 'cancellation_requested',
  CANCELLATION_APPROVED: 'cancellation_approved',
  CANCELLATION_REJECTED: 'cancellation_rejected',
  DIRECT_CANCELLATION: 'direct_cancellation',
  DONATION_SELECTED: 'donation_selected',
  
  // Admin Actions
  ADMIN_REGISTRATION_MODIFIED: 'admin_registration_modified',
  ADMIN_PAYMENT_REVIEWED: 'admin_payment_reviewed',
  ADMIN_BULK_OPERATION: 'admin_bulk_operation',
  
  // System Events
  DATABASE_ERROR: 'database_error',
  EXTERNAL_SERVICE_ERROR: 'external_service_error',
  VALIDATION_SCHEMA_ERROR: 'validation_schema_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  
  // Performance Events
  SLOW_QUERY: 'slow_query',
  HIGH_MEMORY_USAGE: 'high_memory_usage',
  API_TIMEOUT: 'api_timeout',
  
  // User Experience Events
  FORM_ABANDONMENT: 'form_abandonment',
  MULTIPLE_SUBMISSION_ATTEMPTS: 'multiple_submission_attempts',
  BROWSER_ERROR: 'browser_error',
  NETWORK_ERROR: 'network_error'
} as const;

export const EVENT_CATEGORIES = {
  REGISTRATION: 'registration',
  PAYMENT: 'payment',
  CANCELLATION: 'cancellation',
  ADMIN: 'admin',
  SYSTEM: 'system',
  PERFORMANCE: 'performance',
  USER_EXPERIENCE: 'user_experience'
} as const;

export const LOG_SEVERITY = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
} as const;
```

## 2. Logging Service Implementation

### 2.1 Core Logging Service

```typescript
// lib/logging/event-logger.ts
import { createClient } from '@/lib/supabase/server';
import { REGISTRATION_EVENT_TYPES, EVENT_CATEGORIES, LOG_SEVERITY } from './types';

export interface LogEventParams {
  eventType: string;
  category: string;
  severity: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  registrationId?: string;
  invoiceCode?: string;
  eventData?: Record<string, any>;
  errorDetails?: Record<string, any>;
  endpoint?: string;
  httpMethod?: string;
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  durationMs?: number;
  tags?: string[];
  correlationId?: string;
}

export class EventLogger {
  private supabase;
  
  constructor() {
    this.supabase = createClient();
  }

  async logEvent(params: LogEventParams): Promise<void> {
    try {
      const logEntry = {
        event_type: params.eventType,
        event_category: params.category,
        severity: params.severity,
        user_id: params.userId,
        user_email: params.userEmail,
        user_role: params.userRole,
        registration_id: params.registrationId,
        invoice_code: params.invoiceCode,
        event_data: params.eventData || {},
        error_details: params.errorDetails,
        endpoint: params.endpoint,
        http_method: params.httpMethod,
        request_id: params.requestId,
        session_id: params.sessionId,
        user_agent: params.userAgent,
        ip_address: params.ipAddress,
        duration_ms: params.durationMs,
        tags: params.tags || [],
        correlation_id: params.correlationId,
      };

      const { error } = await this.supabase
        .from('event_logs')
        .insert([logEntry]);

      if (error) {
        // Fallback to console logging if database logging fails
        console.error('Failed to log event to database:', error);
        console.log('Event data:', logEntry);
      }
    } catch (error) {
      // Never let logging errors break the main application flow
      console.error('Event logging failed:', error);
    }
  }

  // Convenience methods for different log levels
  async logInfo(eventType: string, category: string, params: Partial<LogEventParams> = {}) {
    return this.logEvent({
      ...params,
      eventType,
      category,
      severity: LOG_SEVERITY.INFO,
    });
  }

  async logError(eventType: string, category: string, error: Error, params: Partial<LogEventParams> = {}) {
    return this.logEvent({
      ...params,
      eventType,
      category,
      severity: LOG_SEVERITY.ERROR,
      errorDetails: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    });
  }

  async logWarning(eventType: string, category: string, params: Partial<LogEventParams> = {}) {
    return this.logEvent({
      ...params,
      eventType,
      category,
      severity: LOG_SEVERITY.WARNING,
    });
  }

  async logCritical(eventType: string, category: string, error: Error, params: Partial<LogEventParams> = {}) {
    return this.logEvent({
      ...params,
      eventType,
      category,
      severity: LOG_SEVERITY.CRITICAL,
      errorDetails: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      tags: [...(params.tags || []), 'urgent'],
    });
  }
}
```

### 2.2 Request Context Middleware

```typescript
// lib/logging/request-context.ts
import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

export interface RequestContext {
  requestId: string;
  endpoint: string;
  httpMethod: string;
  userAgent?: string;
  ipAddress?: string;
  startTime: number;
}

export function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: nanoid(),
    endpoint: request.nextUrl.pathname,
    httpMethod: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined,
    startTime: Date.now(),
  };
}

export function calculateDuration(context: RequestContext): number {
  return Date.now() - context.startTime;
}
```

## 3. Integration Points

### 3.1 API Route Integration Example

```typescript
// app/api/registrations/route.ts (Enhanced with logging)
import { EventLogger } from '@/lib/logging/event-logger';
import { createRequestContext, calculateDuration } from '@/lib/logging/request-context';
import { REGISTRATION_EVENT_TYPES, EVENT_CATEGORIES } from '@/lib/logging/types';

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  const logger = new EventLogger();
  
  try {
    const supabase = await createClient();
    
    // Auth check with logging
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      await logger.logWarning(
        REGISTRATION_EVENT_TYPES.AUTHENTICATION_ERROR,
        EVENT_CATEGORIES.REGISTRATION,
        {
          ...context,
          errorDetails: { authError: authError?.message },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log registration attempt start
    await logger.logInfo(
      REGISTRATION_EVENT_TYPES.REGISTRATION_STARTED,
      EVENT_CATEGORIES.REGISTRATION,
      {
        ...context,
        userId: user.id,
        userEmail: user.email,
      }
    );

    const body = await request.json();
    
    // Validation with detailed error logging
    let validatedData;
    try {
      validatedData = RegistrationFormSchema.parse(body);
    } catch (error) {
      await logger.logError(
        REGISTRATION_EVENT_TYPES.REGISTRANT_VALIDATION_ERROR,
        EVENT_CATEGORIES.REGISTRATION,
        error as Error,
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          eventData: { 
            submittedData: body,
            validationErrors: error instanceof z.ZodError ? error.errors : undefined 
          },
          durationMs: calculateDuration(context),
        }
      );
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }

    // Database operations with transaction logging
    const registrationData = {
      user_id: user.id,
      // ... other fields
    };

    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert([registrationData])
      .select()
      .single();

    if (regError) {
      await logger.logError(
        REGISTRATION_EVENT_TYPES.REGISTRATION_FAILED,
        EVENT_CATEGORIES.REGISTRATION,
        new Error(regError.message),
        {
          ...context,
          userId: user.id,
          userEmail: user.email,
          eventData: { registrationData },
          errorDetails: { databaseError: regError },
          durationMs: calculateDuration(context),
          tags: ['database_error'],
        }
      );
      return NextResponse.json({ error: "Failed to create registration" }, { status: 500 });
    }

    // Success logging
    await logger.logInfo(
      REGISTRATION_EVENT_TYPES.REGISTRATION_CREATED,
      EVENT_CATEGORIES.REGISTRATION,
      {
        ...context,
        userId: user.id,
        userEmail: user.email,
        registrationId: registration.id,
        invoiceCode: registration.invoice_code,
        eventData: { 
          registrantCount: validatedData.registrants.length,
          totalAmount: registration.total_amount 
        },
        durationMs: calculateDuration(context),
      }
    );

    return NextResponse.json({ 
      success: true, 
      registration: registration 
    });

  } catch (error) {
    // Critical error logging
    await logger.logCritical(
      REGISTRATION_EVENT_TYPES.REGISTRATION_FAILED,
      EVENT_CATEGORIES.REGISTRATION,
      error as Error,
      {
        ...context,
        durationMs: calculateDuration(context),
        tags: ['unexpected_error'],
      }
    );
    
    console.error("Registration API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### 3.2 Frontend Component Integration

```typescript
// components/registration/registration-form.tsx (Enhanced with logging)
import { EventLogger } from '@/lib/logging/event-logger';

export function RegistrationForm() {
  const [logger] = useState(() => new EventLogger());
  
  const onSubmit = async (data: RegistrationFormData) => {
    const startTime = Date.now();
    setIsSubmitting(true);
    
    try {
      // Log submission attempt
      await logger.logInfo(
        'form_submission_started',
        EVENT_CATEGORIES.REGISTRATION,
        {
          eventData: { 
            registrantCount: data.registrants.length,
            hasNotes: !!data.notes 
          },
          endpoint: '/api/registrations',
          httpMethod: 'POST',
        }
      );

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        await logger.logError(
          'form_submission_failed',
          EVENT_CATEGORIES.REGISTRATION,
          new Error(result.error || 'Unknown error'),
          {
            eventData: { responseStatus: response.status, result },
            durationMs: duration,
            tags: ['frontend_error'],
          }
        );
        throw new Error(result.error || "Failed to submit registration");
      }
      
      // Success logging
      await logger.logInfo(
        'form_submission_success',
        EVENT_CATEGORIES.REGISTRATION,
        {
          registrationId: result.registration?.id,
          invoiceCode: result.registration?.invoice_code,
          durationMs: duration,
        }
      );
      
      toast.success("Đăng ký thành công!");
      router.push(`/payment/${result.registration.invoice_code}`);
      
    } catch (error) {
      await logger.logError(
        'form_submission_error',
        EVENT_CATEGORIES.REGISTRATION,
        error as Error,
        {
          durationMs: Date.now() - startTime,
          tags: ['frontend_error', 'user_facing_error'],
        }
      );
      
      toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };
}
```

## 4. Monitoring and Alerting

### 4.1 Error Dashboard Queries

```sql
-- Critical errors in last 24 hours
SELECT 
  event_type,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  MAX(created_at) as last_occurrence
FROM event_logs 
WHERE severity = 'critical' 
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY error_count DESC;

-- Registration funnel analysis
WITH registration_events AS (
  SELECT 
    user_id,
    event_type,
    created_at,
    registration_id
  FROM event_logs 
  WHERE event_category = 'registration'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  COUNT(CASE WHEN event_type = 'registration_started' THEN 1 END) as started,
  COUNT(CASE WHEN event_type = 'registration_created' THEN 1 END) as completed,
  COUNT(CASE WHEN event_type = 'registration_failed' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN event_type = 'registration_created' THEN 1 END)::decimal / 
    NULLIF(COUNT(CASE WHEN event_type = 'registration_started' THEN 1 END), 0) * 100, 
    2
  ) as completion_rate
FROM registration_events;

-- Most common validation errors
SELECT 
  event_data->>'fieldName' as field_name,
  event_data->>'errorMessage' as error_message,
  COUNT(*) as frequency
FROM event_logs 
WHERE event_type = 'registrant_validation_error'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY field_name, error_message
ORDER BY frequency DESC
LIMIT 20;
```

### 4.2 Performance Monitoring

```sql
-- Slow API endpoints
SELECT 
  endpoint,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) as request_count
FROM event_logs 
WHERE duration_ms IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint
HAVING AVG(duration_ms) > 5000  -- 5 seconds
ORDER BY avg_duration DESC;

-- Error rate by endpoint
SELECT 
  endpoint,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN severity IN ('error', 'critical') THEN 1 END) as error_count,
  ROUND(
    COUNT(CASE WHEN severity IN ('error', 'critical') THEN 1 END)::decimal / 
    COUNT(*) * 100, 
    2
  ) as error_rate
FROM event_logs 
WHERE endpoint IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint
HAVING COUNT(*) > 10  -- Only endpoints with significant traffic
ORDER BY error_rate DESC;
```

## 5. Implementation Timeline

### Phase 1: Foundation (Week 1)
- [ ] Create event_logs table and indexes
- [ ] Implement core EventLogger class
- [ ] Add logging types and constants
- [ ] Create request context utilities

### Phase 2: Critical Path Logging (Week 2)
- [ ] Integrate logging into registration creation API
- [ ] Add logging to payment processing API
- [ ] Implement cancellation flow logging
- [ ] Add frontend form submission logging

### Phase 3: Comprehensive Coverage (Week 3)
- [ ] Add logging to all admin operations
- [ ] Implement performance monitoring
- [ ] Add validation error tracking
- [ ] Create user experience event logging

### Phase 4: Monitoring & Alerting (Week 4)
- [ ] Create error dashboard queries
- [ ] Set up automated alerts for critical errors
- [ ] Implement log retention policies
- [ ] Create documentation and runbooks

## 6. Security and Privacy Considerations

### 6.1 Data Sensitivity
- **PII Handling**: Never log sensitive personal information directly
- **Password Protection**: Ensure no passwords or tokens are logged
- **Data Minimization**: Only log necessary data for debugging
- **Retention Policies**: Implement automatic log cleanup after 90 days

### 6.2 Access Control
- **Admin Only**: Only super_admin and event_organizer roles can view logs
- **RLS Policies**: Implement Row Level Security on event_logs table
- **Audit Trail**: Log who accesses the logging system

### 6.3 Performance Impact
- **Async Logging**: Never block main application flow for logging
- **Batch Operations**: Consider batching logs for high-volume events
- **Index Optimization**: Monitor index performance and usage
- **Archival Strategy**: Move old logs to cheaper storage

## 7. Testing Strategy

### 7.1 Unit Tests
- Test EventLogger class methods
- Validate log entry structure
- Test error handling in logging service

### 7.2 Integration Tests
- Test API route logging integration
- Verify database constraints and indexes
- Test performance impact under load

### 7.3 End-to-End Tests
- Test complete registration flow logging
- Verify error scenarios are properly logged
- Test log querying and analysis

This comprehensive logging system will provide deep visibility into the registration flow, enabling quick identification and resolution of bugs while maintaining system performance and user privacy.