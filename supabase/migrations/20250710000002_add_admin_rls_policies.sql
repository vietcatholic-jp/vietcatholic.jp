-- Add admin bypass policies for RLS
-- This migration adds policies that allow admin roles to bypass RLS restrictions

-- First, create a security definer function to check admin roles without recursion
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

-- Add admin policies for users table using the helper function
create policy "Admin users can view all users" on public.users
  for select using (is_admin_user(auth.uid()));

create policy "Admin users can update all users" on public.users
  for update using (is_super_or_regional_admin(auth.uid()));

-- Add admin policies for registrations table using the helper function
create policy "Admin users can view all registrations" on public.registrations
  for select using (is_admin_user(auth.uid()));

create policy "Admin users can update all registrations" on public.registrations
  for update using (is_super_or_regional_admin(auth.uid()));

create policy "Admin users can delete all registrations" on public.registrations
  for delete using (is_super_or_regional_admin(auth.uid()));

-- Add admin policies for registrants table using the helper function
create policy "Admin users can view all registrants" on public.registrants
  for select using (is_admin_user(auth.uid()));

create policy "Admin users can update all registrants" on public.registrants
  for update using (is_super_or_regional_admin(auth.uid()));

create policy "Admin users can delete all registrants" on public.registrants
  for delete using (is_super_or_regional_admin(auth.uid()));

-- Add admin policies for payment receipts table (if exists)
create policy "Admin users can view all payment receipts" on public.receipts
  for select using (is_admin_user(auth.uid()));

-- Add admin policies for tickets table (if exists)  
create policy "Admin users can view all tickets" on public.tickets
  for select using (is_admin_user(auth.uid()));

-- Add storage policies for admin access using the helper function
create policy "Admin users can view all receipts"
on storage.objects for select
using (
  bucket_id = 'receipts' and is_admin_user(auth.uid())
);

create policy "Admin users can view all tickets in storage"
on storage.objects for select
using (
  bucket_id = 'tickets' and is_admin_user(auth.uid())
);

-- Success message
SELECT 'Admin RLS policies added successfully!' as message;
