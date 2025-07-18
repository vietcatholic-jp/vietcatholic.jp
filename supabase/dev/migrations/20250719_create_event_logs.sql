-- Migration: Create event_logs table and indexes for registration logging system
CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  event_category VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info',
  user_id UUID REFERENCES users(id),
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  user_agent TEXT,
  ip_address INET,
  request_id VARCHAR(100),
  endpoint VARCHAR(200),
  http_method VARCHAR(10),
  session_id VARCHAR(100),
  event_data JSONB NOT NULL DEFAULT '{}',
  error_details JSONB,
  registration_id UUID REFERENCES registrations(id),
  invoice_code VARCHAR(20),
  registrant_count INTEGER,
  duration_ms INTEGER,
  memory_usage_mb DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  correlation_id VARCHAR(100),
  CONSTRAINT event_logs_event_type_check CHECK (event_type ~ '^[a-z_]+$'),
  CONSTRAINT event_logs_severity_check CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_user_id ON event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_registration_id ON event_logs(registration_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_severity ON event_logs(severity);
CREATE INDEX IF NOT EXISTS idx_event_logs_category_created ON event_logs(event_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_logs_request_id ON event_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_correlation_id ON event_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_invoice_code ON event_logs(invoice_code);
CREATE INDEX IF NOT EXISTS idx_event_logs_errors ON event_logs(created_at DESC, event_type) WHERE severity IN ('error', 'critical');
CREATE INDEX IF NOT EXISTS idx_event_logs_event_data_gin ON event_logs USING GIN(event_data);
CREATE INDEX IF NOT EXISTS idx_event_logs_error_details_gin ON event_logs USING GIN(error_details);
