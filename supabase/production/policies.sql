-- Production Policies
-- All RLS policies consolidated in one file

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.registrations enable row level security;
alter table public.registrants enable row level security;
alter table public.receipts enable row level security;
alter table public.tickets enable row level security;
alter table public.cancel_requests enable row level security;
alter table public.transportation_groups enable row level security;
alter table public.transportation_registrations enable row level security;

-- USER POLICIES
-- Users can view and update their own data
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- Admin policies for users
create policy "Admin users can view all users" on public.users
  for select using (is_admin_user(auth.uid()));

create policy "Admin users can update all users" on public.users
  for update using (is_super_or_regional_admin(auth.uid()));

-- REGISTRATION POLICIES
-- Users can manage their own registrations
create policy "Users can view own registrations" on public.registrations
  for select using (auth.uid() = user_id);

create policy "Users can create own registrations" on public.registrations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own registrations" on public.registrations
  for update using (auth.uid() = user_id);

create policy "Users can delete own registrations" on public.registrations
  for delete using (auth.uid() = user_id);

-- Admin policies for registrations
create policy "Admin users can view all registrations" on public.registrations
  for select using (is_admin_user(auth.uid()));

create policy "Admin users can update all registrations" on public.registrations
  for update using (is_super_or_regional_admin(auth.uid()));

create policy "Admin users can delete all registrations" on public.registrations
  for delete using (is_super_or_regional_admin(auth.uid()));

-- REGISTRANT POLICIES
-- Users can manage registrants for their own registrations
create policy "Users can view own registrants" on public.registrants
  for select using (
    exists (
      select 1 from public.registrations
      where registrations.id = registrants.registration_id
      and registrations.user_id = auth.uid()
    )
  );

create policy "Users can manage own registrants" on public.registrants
  for all using (
    exists (
      select 1 from public.registrations
      where registrations.id = registrants.registration_id
      and registrations.user_id = auth.uid()
    )
  );

-- Admin policies for registrants
create policy "Admin users can view all registrants" on public.registrants
  for select using (is_admin_user(auth.uid()));

create policy "Admin users can update all registrants" on public.registrants
  for update using (is_super_or_regional_admin(auth.uid()));

create policy "Admin users can delete all registrants" on public.registrants
  for delete using (is_super_or_regional_admin(auth.uid()));

create policy "Admins can insert registrants" on public.registrants
  for insert with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('super_admin', 'registration_manager', 'regional_admin', 'event_organizer', 'group_leader')
    )
  );

-- RECEIPT POLICIES
-- Users can manage receipts for their own registrations
create policy "Users can view own receipts" on public.receipts
  for select using (
    exists (
      select 1 from public.registrations
      where registrations.id = receipts.registration_id
      and registrations.user_id = auth.uid()
    )
  );

create policy "Users can manage own receipts" on public.receipts
  for all using (
    exists (
      select 1 from public.registrations
      where registrations.id = receipts.registration_id
      and registrations.user_id = auth.uid()
    )
  );

-- Admin policies for receipts
create policy "Admin users can view all receipts" on public.receipts
  for select using (is_admin_user(auth.uid()));

-- TICKET POLICIES
-- Users can view tickets for their own registrations
create policy "Users can view own tickets" on public.tickets
  for select using (
    exists (
      select 1 from public.registrants
      join public.registrations on registrations.id = registrants.registration_id
      where registrants.id = tickets.registrant_id
      and registrations.user_id = auth.uid()
    )
  );

-- Admin policies for tickets
create policy "Admin users can view all tickets" on public.tickets
  for select using (is_admin_user(auth.uid()));

-- CANCEL REQUEST POLICIES
-- Users can manage their own cancel requests
create policy "Users can view own cancel requests" on public.cancel_requests
  for select using (auth.uid() = user_id);

create policy "Users can create own cancel requests" on public.cancel_requests
  for insert with check (auth.uid() = user_id);

-- Admin policies for cancel requests
create policy "Event organizers can view all cancel requests" on public.cancel_requests
  for select using (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.role in ('registration_manager', 'super_admin', 'cashier_role')
    )
  );

create policy "Event organizers can update cancel requests" on public.cancel_requests
  for update using (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.role in ('registration_manager', 'super_admin', 'cashier_role')
    )
  );

-- TRANSPORTATION GROUP POLICIES
-- Regional admins can manage transport groups in their region
create policy "Regional admins can manage their region's transport groups" on public.transportation_groups
  for all using (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and (
        users.role = 'super_admin' or 
        (users.role = 'regional_admin' and users.region = transportation_groups.region)
      )
    )
  );

-- Users can view transport groups in their region
create policy "Users can view transport groups in their region" on public.transportation_groups
  for select using (
    exists (
      select 1 from public.users 
      where users.id = auth.uid() 
      and users.region = transportation_groups.region
    )
  );

-- TRANSPORTATION REGISTRATION POLICIES
-- Users can view transport registrations they created
create policy "Users can view transport registrations they created" on public.transportation_registrations
  for select using (auth.uid() = registered_by);

-- Regional admins can manage transport registrations in their region
create policy "Regional admins can manage transport registrations in their region" on public.transportation_registrations
  for all using (
    exists (
      select 1 from public.users u
      join public.transportation_groups tg on tg.id = transportation_group_id
      where u.id = auth.uid() 
      and (
        u.role = 'super_admin' or 
        (u.role = 'regional_admin' and u.region = tg.region)
      )
    )
  );

-- STORAGE POLICIES
-- Users can upload and view their own receipts
create policy "Users can upload their own receipts"
on storage.objects for insert
with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own receipts"
on storage.objects for select
using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users can upload and view portraits
create policy "Users can upload portraits"
on storage.objects for insert
with check (bucket_id = 'portraits' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update portraits"
on storage.objects for update
using (bucket_id = 'portraits' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete portraits"
on storage.objects for delete
using (bucket_id = 'portraits' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view portraits"
on storage.objects for select
using (bucket_id = 'portraits');

-- Users can view their own tickets
create policy "Users can view their tickets"
on storage.objects for select
using (bucket_id = 'tickets' and auth.uid()::text = (storage.foldername(name))[1]);

-- Ticket frames are publicly viewable
create policy "Ticket frames are publicly viewable"
on storage.objects for select
using (bucket_id = 'ticket-frames');

-- Admin storage policies
create policy "Admin users can view all receipts" on storage.objects
  for select using (
    bucket_id = 'receipts' and is_admin_user(auth.uid())
  );

create policy "Admin users can view all tickets in storage" on storage.objects
  for select using (
    bucket_id = 'tickets' and is_admin_user(auth.uid())
  );
