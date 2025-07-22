// Event Types for Registration Flow
export const REGISTRATION_EVENT_TYPES = {
  REGISTRATION_STARTED: 'registration_started',
  REGISTRATION_CREATED: 'registration_created',
  REGISTRATION_FAILED: 'registration_failed',
  REGISTRATION_MODIFIED: 'registration_modified',
  REGISTRATION_MODIFY_FAILED: 'registration_modify_failed',
  REGISTRANT_VALIDATION_ERROR: 'registrant_validation_error',
  INVOICE_GENERATION_ERROR: 'invoice_generation_error',
  REGISTRATION_UPDATED: 'registration_updated',
  REGISTRATION_UPDATE_FAILED: 'registration_update_failed',
  REGISTRANT_DELETED: 'registrant_deleted',
  REGISTRANT_CREATED: 'registrant_created',
  PAYMENT_RECEIPT_UPLOADED: 'payment_receipt_uploaded',
  PAYMENT_RECEIPT_FAILED: 'payment_receipt_failed',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  PAYMENT_REJECTED: 'payment_rejected',
  PAYMENT_VALIDATION_ERROR: 'payment_validation_error',
  CANCELLATION_REQUESTED: 'cancellation_requested',
  CANCELLATION_APPROVED: 'cancellation_approved',
  CANCELLATION_REJECTED: 'cancellation_rejected',
  DIRECT_CANCELLATION: 'direct_cancellation',
  DONATION_SELECTED: 'donation_selected',
  ADMIN_REGISTRATION_MODIFIED: 'admin_registration_modified',
  ADMIN_PAYMENT_REVIEWED: 'admin_payment_reviewed',
  ADMIN_BULK_OPERATION: 'admin_bulk_operation',
  DATABASE_ERROR: 'database_error',
  EXTERNAL_SERVICE_ERROR: 'external_service_error',
  VALIDATION_SCHEMA_ERROR: 'validation_schema_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  SLOW_QUERY: 'slow_query',
  HIGH_MEMORY_USAGE: 'high_memory_usage',
  API_TIMEOUT: 'api_timeout',
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
