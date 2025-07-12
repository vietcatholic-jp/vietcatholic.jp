-- Add facebook_url field to users table
ALTER TABLE public.users ADD COLUMN facebook_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.users.facebook_url IS 'User Facebook profile URL from OAuth login';
