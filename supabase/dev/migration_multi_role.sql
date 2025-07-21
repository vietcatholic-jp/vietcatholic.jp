-- Migration script to update database for multi-role registration system
-- Run this script on your Supabase database

-- 1. Add the new event participation role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE event_participation_role AS ENUM (
        'participant',           -- Regular attendee
        'volunteer_media',       -- Media team volunteer
        'volunteer_logistics',   -- Logistics team volunteer
        'volunteer_liturgy',     -- Liturgy team volunteer
        'volunteer_security',    -- Security team volunteer
        'volunteer_registration',-- Registration desk volunteer
        'volunteer_catering',    -- Catering team volunteer
        'organizer_core',        -- Core organizing committee
        'organizer_regional',    -- Regional organizer
        'speaker',               -- Speaker/presenter
        'performer'              -- Performer (choir, band, etc.)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update registrants table structure
ALTER TABLE public.registrants 
  -- Make email optional for additional registrants
  ALTER COLUMN email DROP NOT NULL,
  -- Make contact fields optional for additional registrants
  ALTER COLUMN province DROP NOT NULL,
  ALTER COLUMN diocese DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

-- 3. Add new columns to registrants table
ALTER TABLE public.registrants 
  ADD COLUMN IF NOT EXISTS event_role event_participation_role DEFAULT 'participant',
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

-- 4. Drop old column if it exists (from previous implementation)
DO $$ BEGIN
    ALTER TABLE public.registrants DROP COLUMN IF EXISTS participation_role;
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

-- 5. Update existing registrants to mark first one as primary
WITH first_registrants AS (
  SELECT DISTINCT ON (registration_id) id, registration_id
  FROM public.registrants
  ORDER BY registration_id, created_at
)
UPDATE public.registrants 
SET is_primary = true
WHERE id IN (SELECT id FROM first_registrants);

-- 6. Set default event_role for existing registrants
UPDATE public.registrants 
SET event_role = 'participant' 
WHERE event_role IS NULL;

-- 7. Update existing user roles to include group_leader
DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'group_leader';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 8. Create view for admin reporting by event roles
CREATE OR REPLACE VIEW registrant_role_summary AS
SELECT 
  r.event_role,
  COUNT(*) as total_count,
  COUNT(CASE WHEN reg.status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN reg.status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN reg.status = 'pending' THEN 1 END) as pending_count
FROM public.registrants r
JOIN public.registrations reg ON reg.id = r.registration_id
GROUP BY r.event_role
ORDER BY total_count DESC;

-- 9. Grant permissions for the new view
GRANT SELECT ON registrant_role_summary TO authenticated;

-- 10. Create function to get role statistics
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
    COUNT(CASE WHEN reg.status = 'paid' THEN 1 END) as paid_count,
    COUNT(CASE WHEN reg.status = 'pending' THEN 1 END) as pending_count
  FROM public.registrants r
  JOIN public.registrations reg ON reg.id = r.registration_id
  GROUP BY r.event_role
  ORDER BY total_count DESC;
END;
$$;

-- 11. Create RLS policy for role statistics function
GRANT EXECUTE ON FUNCTION get_role_statistics() TO authenticated;

-- Success message
SELECT 'Database migration completed successfully!' as message;
