-- Production Initialization
-- Initial setup for production environment

-- Update specific user to super_admin role
-- Replace the email with the actual production admin email
UPDATE public.users 
SET role = 'super_admin', 
    region = 'kanto',  -- Set appropriate region
    updated_at = now()
WHERE email = 'admin@daihoiconggiao.jp';  -- Replace with actual production admin email

-- Create a default active event configuration
INSERT INTO public.event_configs (
  name,
  description,
  start_date,
  end_date,
  base_price,
  is_active,
  cancellation_deadline
) VALUES (
  'ĐẠI HỘI TOÀN QUỐC NĂM THÁNH 2025',
  'Chủ đề: Những Người Hành Hương của Hy Vọng',
  '2025-09-14 09:00:00+09'::timestamptz,
  '2025-09-15 18:00:00+09'::timestamptz,
  6000.00,
  true,
  '2025-09-08 23:59:59+09'::timestamptz
) ON CONFLICT DO NOTHING;

-- Create default ticket frame
INSERT INTO public.ticket_frames (
  name,
  description,
  frame_url,
  is_default
) VALUES (
  'Default Frame 2025',
  'Default ticket frame for Jubilee Year 2025',
  'https://example.com/default-frame.png',
  true
) ON CONFLICT DO NOTHING;

-- Verify the admin user setup
SELECT id, email, role, region, created_at FROM public.users WHERE role = 'super_admin';

-- Success message
SELECT 'Production environment initialized successfully!' as message;
