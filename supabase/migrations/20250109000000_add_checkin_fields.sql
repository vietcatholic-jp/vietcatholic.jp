-- Add check-in fields to registrants table
ALTER TABLE public.registrants 
ADD COLUMN IF NOT EXISTS is_checked_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;

-- Create index for check-in queries
CREATE INDEX IF NOT EXISTS idx_registrants_checked_in ON public.registrants(is_checked_in);
CREATE INDEX IF NOT EXISTS idx_registrants_checked_in_at ON public.registrants(checked_in_at);

-- Update the updated_at trigger for registrants table if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists for registrants table
DROP TRIGGER IF EXISTS update_registrants_updated_at ON public.registrants;
CREATE TRIGGER update_registrants_updated_at
  BEFORE UPDATE ON public.registrants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Event logs are optional - check-in works without them

-- Create a view for check-in statistics
CREATE OR REPLACE VIEW check_in_stats AS
SELECT 
  DATE(checked_in_at) as check_in_date,
  EXTRACT(HOUR FROM checked_in_at) as check_in_hour,
  COUNT(*) as check_ins_count,
  STRING_AGG(full_name, ', ' ORDER BY checked_in_at) as checked_in_names
FROM public.registrants 
WHERE is_checked_in = true 
  AND checked_in_at IS NOT NULL
GROUP BY DATE(checked_in_at), EXTRACT(HOUR FROM checked_in_at)
ORDER BY check_in_date DESC, check_in_hour DESC;

-- Grant permissions for the check-in stats view
GRANT SELECT ON check_in_stats TO authenticated;

-- Add RLS policy for check-in data access
CREATE POLICY "Registration managers can view all check-in data" ON public.registrants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('registration_manager', 'event_organizer', 'super_admin')
    )
  );

-- Add RLS policy for check-in updates
CREATE POLICY "Registration managers can update check-in status" ON public.registrants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('registration_manager', 'event_organizer', 'super_admin')
    )
  );
