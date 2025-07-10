-- Add province field to users table
ALTER TABLE public.users ADD COLUMN province text;

-- Add comment for documentation
COMMENT ON COLUMN public.users.province IS 'User province in Japan (e.g., Tokyo, Osaka, etc.)';
