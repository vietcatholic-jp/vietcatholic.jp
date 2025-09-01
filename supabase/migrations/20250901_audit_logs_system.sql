-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only super admins can view audit logs
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role in ('super_admin','registration_manager')
    )
  );

-- Only authenticated users can insert audit logs (for system actions)
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Audit log table for tracking administrative actions and system events';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (e.g., admin_password_reset, user_role_change)';
COMMENT ON COLUMN public.audit_logs.table_name IS 'Name of the table affected by the action';
COMMENT ON COLUMN public.audit_logs.record_id IS 'ID of the record affected by the action';
COMMENT ON COLUMN public.audit_logs.old_values IS 'Previous values before the action (for updates)';
COMMENT ON COLUMN public.audit_logs.new_values IS 'New values after the action or additional context';
