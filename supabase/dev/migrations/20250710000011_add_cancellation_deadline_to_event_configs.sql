-- Add cancellation_deadline field to event_configs table
ALTER TABLE public.event_configs ADD COLUMN cancellation_deadline timestamptz;

-- Add comment for documentation
COMMENT ON COLUMN public.event_configs.cancellation_deadline IS 'Deadline for users to cancel their paid registrations';

-- Update existing active event with a reasonable cancellation deadline (e.g., 7 days before event start)
UPDATE public.event_configs 
SET cancellation_deadline = start_date - INTERVAL '7 days'
WHERE is_active = true AND start_date IS NOT NULL;
