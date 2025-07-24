-- Migration script to update event_participation_role enum
-- Run this script to update the enum and existing data

-- First, update the enum type to include the new values
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_media_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_media_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_media_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_activity_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_activity_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_activity_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_discipline_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_discipline_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_discipline_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_logistics_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_logistics_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_logistics_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_liturgy_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_liturgy_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_liturgy_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_security_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_security_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_security_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_registration_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_registration_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_registration_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_catering_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_catering_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_catering_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_health_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_health_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_health_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_audio_light_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_audio_light_sub_leader';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_audio_light_member';
ALTER TYPE event_participation_role ADD VALUE IF NOT EXISTS 'volunteer_group_sub_leader';

-- Update existing data to use the new enum values
-- Map old values to new member roles (default to member level)
UPDATE public.registrants SET event_role = 'volunteer_media_member' WHERE event_role = 'volunteer_media';
UPDATE public.registrants SET event_role = 'volunteer_logistics_member' WHERE event_role = 'volunteer_logistics';
UPDATE public.registrants SET event_role = 'volunteer_liturgy_member' WHERE event_role = 'volunteer_liturgy';
UPDATE public.registrants SET event_role = 'volunteer_security_member' WHERE event_role = 'volunteer_security';
UPDATE public.registrants SET event_role = 'volunteer_registration_member' WHERE event_role = 'volunteer_registration';
UPDATE public.registrants SET event_role = 'volunteer_catering_member' WHERE event_role = 'volunteer_catering';

-- Update the get_role_statistics function to handle the new roles
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
      WHEN 'participant' THEN 'Người tham gia'
      -- Media team roles
      WHEN 'volunteer_media_leader' THEN 'Trưởng ban Truyền thông'
      WHEN 'volunteer_media_sub_leader' THEN 'Phó ban Truyền thông'
      WHEN 'volunteer_media_member' THEN 'Thành viên ban Truyền thông'
      -- Activity team roles
      WHEN 'volunteer_activity_leader' THEN 'Trưởng ban Sinh hoạt'
      WHEN 'volunteer_activity_sub_leader' THEN 'Phó ban Sinh hoạt'
      WHEN 'volunteer_activity_member' THEN 'Thành viên ban Sinh hoạt'
      -- Discipline team roles
      WHEN 'volunteer_discipline_leader' THEN 'Trưởng ban Kỷ luật'
      WHEN 'volunteer_discipline_sub_leader' THEN 'Phó ban Kỷ luật'
      WHEN 'volunteer_discipline_member' THEN 'Thành viên ban Kỷ luật'
      -- Logistics team roles
      WHEN 'volunteer_logistics_leader' THEN 'Trưởng ban Hậu cần'
      WHEN 'volunteer_logistics_sub_leader' THEN 'Phó ban Hậu cần'
      WHEN 'volunteer_logistics_member' THEN 'Thành viên ban Hậu cần'
      -- Liturgy team roles
      WHEN 'volunteer_liturgy_leader' THEN 'Trưởng ban Phụng vụ'
      WHEN 'volunteer_liturgy_sub_leader' THEN 'Phó ban Phụng vụ'
      WHEN 'volunteer_liturgy_member' THEN 'Thành viên ban Phụng vụ'
      -- Security team roles
      WHEN 'volunteer_security_leader' THEN 'Trưởng ban An ninh'
      WHEN 'volunteer_security_sub_leader' THEN 'Phó ban An ninh'
      WHEN 'volunteer_security_member' THEN 'Thành viên ban An ninh'
      -- Registration team roles
      WHEN 'volunteer_registration_leader' THEN 'Trưởng ban Thư ký'
      WHEN 'volunteer_registration_sub_leader' THEN 'Phó ban Thư ký'
      WHEN 'volunteer_registration_member' THEN 'Thành viên ban Thư ký'
      -- Catering team roles
      WHEN 'volunteer_catering_leader' THEN 'Trưởng ban Ẩm thực'
      WHEN 'volunteer_catering_sub_leader' THEN 'Phó ban Ẩm thực'
      WHEN 'volunteer_catering_member' THEN 'Thành viên ban Ẩm thực'
      -- Health team roles
      WHEN 'volunteer_health_leader' THEN 'Trưởng ban Y tế'
      WHEN 'volunteer_health_sub_leader' THEN 'Phó ban Y tế'
      WHEN 'volunteer_health_member' THEN 'Thành viên ban Y tế'
      -- Audio Light team roles
      WHEN 'volunteer_audio_light_leader' THEN 'Trưởng ban Âm thanh Ánh sáng'
      WHEN 'volunteer_audio_light_sub_leader' THEN 'Phó ban Âm thanh Ánh sáng'
      WHEN 'volunteer_audio_light_member' THEN 'Thành viên ban Âm thanh Ánh sáng'
      -- Group leadership roles
      WHEN 'volunteer_group_leader' THEN 'Trưởng nhóm các đội'
      WHEN 'volunteer_group_sub_leader' THEN 'Phó trưởng nhóm các đội'
      -- Organizer roles
      WHEN 'organizer_core' THEN 'Ban Tổ chức chính'
      WHEN 'organizer_regional' THEN 'Ban Tổ chức khu vực'
      -- Special roles
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

-- Success message
SELECT 'Event participation roles migration completed successfully!' as message;
