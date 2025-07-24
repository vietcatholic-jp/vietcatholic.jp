-- Team Assignment Features Migration
-- This migration adds the core functionality for team assignment system
-- Admin policies for event teams

-- event_teams.capacity
ALTER TABLE public.event_teams
  ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 0;

create policy "Registration manager and Admin can view all event teams" on public.event_teams
  for select using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('registration_manager', 'super_admin')
    )
  );

create policy "Registration manager and Admin can update event teams" on public.event_teams
  for update using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role in ('registration_manager', 'super_admin')
    )
  );