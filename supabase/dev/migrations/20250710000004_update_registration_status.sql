-- Migration to update registration_status enum with new values
-- This migration safely updates the enum type to include new status values

-- First, create the new enum type with all values
CREATE TYPE registration_status_new AS ENUM (
  'pending',          -- Initial registration, waiting for payment
  'report_paid',      -- User uploaded payment receipt
  'confirm_paid',     -- Admin confirmed payment is correct
  'payment_rejected', -- Admin rejected payment
  'cancelled',        -- Registration cancelled
  'confirmed',        -- Fully confirmed, tickets can be generated
  'checked_in',       -- Participant checked in at event
  'checked_out'       -- Participant checked out from event
);

-- Drop the view that depends on the status column
DROP VIEW IF EXISTS registrant_role_summary;

-- First, remove the default value to avoid casting issues
ALTER TABLE public.registrations ALTER COLUMN status DROP DEFAULT;

-- Update the registrations table to use the new enum
ALTER TABLE public.registrations 
  ALTER COLUMN status TYPE registration_status_new 
  USING (
    CASE status::text
      WHEN 'pending' THEN 'pending'::registration_status_new
      WHEN 'paid' THEN 'confirm_paid'::registration_status_new  -- Map old 'paid' to 'confirm_paid'
      WHEN 'cancelled' THEN 'cancelled'::registration_status_new
      WHEN 'confirmed' THEN 'confirmed'::registration_status_new
      ELSE 'pending'::registration_status_new  -- Default fallback
    END
  );

-- Drop the old enum type
DROP TYPE registration_status;

-- Rename the new enum type to the original name
ALTER TYPE registration_status_new RENAME TO registration_status;

-- Restore the default value with the new enum type
ALTER TABLE public.registrations ALTER COLUMN status SET DEFAULT 'pending'::registration_status;

-- Update the view to use the new status values
DROP VIEW IF EXISTS registrant_role_summary;
CREATE OR REPLACE VIEW registrant_role_summary AS
SELECT 
  r.event_role,
  COUNT(*) as total_count,
  COUNT(CASE WHEN reg.status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN reg.status = 'confirm_paid' THEN 1 END) as confirm_paid_count,
  COUNT(CASE WHEN reg.status = 'report_paid' THEN 1 END) as report_paid_count,
  COUNT(CASE WHEN reg.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN reg.status = 'payment_rejected' THEN 1 END) as payment_rejected_count,
  COUNT(CASE WHEN reg.status = 'checked_in' THEN 1 END) as checked_in_count,
  COUNT(CASE WHEN reg.status = 'checked_out' THEN 1 END) as checked_out_count
FROM public.registrants r
JOIN public.registrations reg ON reg.id = r.registration_id
GROUP BY r.event_role
ORDER BY total_count DESC;

-- Grant permissions for the updated view
GRANT SELECT ON registrant_role_summary TO authenticated;

-- Update the function to use the new status values
CREATE OR REPLACE FUNCTION get_role_statistics()
RETURNS TABLE (
  role_name text,
  role_label text,
  total_count bigint,
  confirmed_count bigint,
  paid_count bigint,
  pending_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.event_role::text as role_name,
    CASE r.event_role
      WHEN 'participant' THEN 'Tham dự viên'
      WHEN 'volunteer_media' THEN 'Ban Truyền thông'
      WHEN 'volunteer_logistics' THEN 'Ban Hậu cần'
      WHEN 'volunteer_liturgy' THEN 'Ban Phụng vụ'
      WHEN 'volunteer_security' THEN 'Ban An ninh'
      WHEN 'volunteer_registration' THEN 'Ban Đăng ký'
      WHEN 'volunteer_catering' THEN 'Ban Ẩm thực'
      WHEN 'organizer_core' THEN 'Ban Tổ chức chính'
      WHEN 'organizer_regional' THEN 'Ban Tổ chức khu vực'
      WHEN 'speaker' THEN 'Diễn giả'
      WHEN 'performer' THEN 'Nghệ sĩ biểu diễn'
      ELSE r.event_role::text
    END as role_label,
    COUNT(*) as total_count,
    COUNT(CASE WHEN reg.status = 'confirmed' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN reg.status IN ('report_paid', 'confirm_paid') THEN 1 END) as paid_count,
    COUNT(CASE WHEN reg.status = 'pending' THEN 1 END) as pending_count
  FROM public.registrants r
  JOIN public.registrations reg ON reg.id = r.registration_id
  GROUP BY r.event_role
  ORDER BY total_count DESC;
END;
$$;

-- Grant execute permission for the updated function
GRANT EXECUTE ON FUNCTION get_role_statistics() TO authenticated;

-- Success message
SELECT 'Registration status enum updated successfully!' as message;
