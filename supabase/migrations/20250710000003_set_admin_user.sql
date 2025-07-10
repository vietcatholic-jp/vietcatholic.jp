-- Update specific user to super_admin role
-- Replace 'your-email@example.com' with your actual email address

-- You'll need to run this after identifying your user ID
-- First find your user ID with: SELECT id, email, role FROM public.users WHERE email = 'your-actual-email@example.com';
-- Then update the role

UPDATE public.users 
SET role = 'super_admin', 
    region = 'kanto',  -- Set appropriate region
    updated_at = now()
WHERE email = 'dang.h.dang@gmail.com';  -- Replace with your actual email

-- Verify the update
SELECT id, email, role, region FROM public.users WHERE email = 'dang.h.dang@gmail.com';
