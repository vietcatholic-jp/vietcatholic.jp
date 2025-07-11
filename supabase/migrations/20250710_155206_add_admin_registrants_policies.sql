-- Add admin policies for registrants table

-- Allow admins to insert registrants for any registration
create policy "Admins can insert registrants" on public.registrants
  for insert with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('super_admin', 'registration_manager', 'regional_admin', 'event_organizer', 'group_leader')
    )
);

-- Allow admins to update registrants for any registration
create policy "Admins can update registrants" on public.registrants
  for update using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('super_admin','registration_manager', 'regional_admin', 'event_organizer', 'group_leader')
    )
);

-- Allow admins to delete registrants for any registration
/**drop policy "Admins can delete registrants" on public.registrants
  for delete using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('super_admin', 'regional_admin', 'event_organizer', 'group_leader')
    )
  );
**/

-- Allow admins to view all registrants
create policy "Admins can view all registrants" on public.registrants
  for select using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('super_admin', 'registration_manager', 'regional_admin', 'event_organizer', 'group_leader')
    )
);
