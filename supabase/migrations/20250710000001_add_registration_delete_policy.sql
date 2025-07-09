-- Add missing DELETE policy for registrations table
create policy "Users can delete own registrations" on public.registrations
  for delete using (auth.uid() = user_id);
