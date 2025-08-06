-- Add selected_attendance_day column to registrants table
-- This field stores the specific date when a registrant chooses to attend only one day
ALTER TABLE public.registrants
  ADD COLUMN IF NOT EXISTS selected_attendance_day DATE;

-- Add comment to describe the field
COMMENT ON COLUMN public.registrants.selected_attendance_day IS 'Specific date the registrant chooses to attend when second_day_only is true';

-- Update existing records: set selected_attendance_day to second day (2025-09-15) 
-- for all registrants where second_day_only is true
UPDATE public.registrants 
SET selected_attendance_day = '2025-09-15'
WHERE second_day_only = true;
