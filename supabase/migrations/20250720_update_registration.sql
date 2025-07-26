-- Remove the old foreign key constraint
ALTER TABLE event_logs
DROP CONSTRAINT event_logs_registration_id_fkey;

-- Add the new foreign key constraint with ON DELETE CASCADE
ALTER TABLE event_logs
ADD CONSTRAINT event_logs_registration_id_fkey
FOREIGN KEY (registration_id)
REFERENCES registrations(id)
ON DELETE CASCADE;

-- Add go_with column to registrants table
alter table public.registrants
  add column if not exists go_with boolean default false;

alter table public.registrants
  add column if not exists second_day_only boolean default false;