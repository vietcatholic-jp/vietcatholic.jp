-- Fix infinite recursion in RLS policies
-- Drop the problematic policies and recreate them properly

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin users can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can update all users" ON public.users;
DROP POLICY IF EXISTS "Admin users can view all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admin users can update all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admin users can delete all registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admin users can view all registrants" ON public.registrants;
DROP POLICY IF EXISTS "Admin users can update all registrants" ON public.registrants;
DROP POLICY IF EXISTS "Admin users can delete all registrants" ON public.registrants;
DROP POLICY IF EXISTS "Admin users can view all payment receipts" ON public.receipts;
DROP POLICY IF EXISTS "Admin users can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admin users can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can view all tickets in storage" ON storage.objects;

-- Create helper functions to check admin roles without recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_id;
  RETURN user_role IN ('super_admin', 'regional_admin', 'event_organizer', 'group_leader');
END;
$$;

CREATE OR REPLACE FUNCTION is_super_or_regional_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = user_id;
  RETURN user_role IN ('super_admin', 'regional_admin');
END;
$$;

-- Re-create policies using the helper functions
CREATE POLICY "Admin users can view all users" ON public.users
  FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "Admin users can update all users" ON public.users
  FOR UPDATE USING (is_super_or_regional_admin(auth.uid()));

CREATE POLICY "Admin users can view all registrations" ON public.registrations
  FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "Admin users can update all registrations" ON public.registrations
  FOR UPDATE USING (is_super_or_regional_admin(auth.uid()));

CREATE POLICY "Admin users can delete all registrations" ON public.registrations
  FOR DELETE USING (is_super_or_regional_admin(auth.uid()));

CREATE POLICY "Admin users can view all registrants" ON public.registrants
  FOR SELECT USING (is_admin_user(auth.uid()));

CREATE POLICY "Admin users can update all registrants" ON public.registrants
  FOR UPDATE USING (is_super_or_regional_admin(auth.uid()));

CREATE POLICY "Admin users can delete all registrants" ON public.registrants
  FOR DELETE USING (is_super_or_regional_admin(auth.uid()));

-- Storage policies for admin access
CREATE POLICY "Admin users can view all receipts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' AND is_admin_user(auth.uid())
  );

CREATE POLICY "Admin users can view all tickets in storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tickets' AND is_admin_user(auth.uid())
  );

-- Success message
SELECT 'Fixed infinite recursion in RLS policies!' as message;
