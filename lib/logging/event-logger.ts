import { createClient } from '@/lib/supabase/server';
import { LOG_SEVERITY } from './types';

export interface LogEventParams {
  eventType: string;
  category: string;
  severity: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  registrationId?: string;
  invoiceCode?: string;
  eventData?: object;
  errorDetails?: object;
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
  async logEvent(params: LogEventParams): Promise<void> {
    try {
      const supabase = await createClient();
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
      const { error } = await supabase.from('event_logs').insert([logEntry]);
      if (error) {
        console.error('Failed to log event to database:', error);
        console.log('Event data:', logEntry);
      }
    } catch (error) {
      console.error('Event logging failed:', error);
    }
  }

  async logInfo(eventType: string, category: string, params: Partial<LogEventParams> = {}) {
    return this.logEvent({ ...params, eventType, category, severity: LOG_SEVERITY.INFO });
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
    return this.logEvent({ ...params, eventType, category, severity: LOG_SEVERITY.WARNING });
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
