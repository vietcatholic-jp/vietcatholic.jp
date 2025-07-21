-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('participant', 'registration_manager', 'event_organizer','group_leader', 'regional_admin', 'super_admin');
create type region_type as enum ('kanto', 'kansai', 'chubu', 'kyushu', 'chugoku', 'shikoku', 'tohoku', 'hokkaido');
create type gender_type as enum ('male', 'female', 'other');
create type age_group_type as enum ('under_12','12_17', '18_25', '26_35', '36_50', 'over_50');
create type shirt_size_type as enum ('XS', 'S', 'M', 'L', 'XL', 'XXL');
create type registration_status as enum (
  'pending',          -- Initial registration, waiting for payment
  'report_paid',      -- User uploaded payment receipt
  'confirm_paid',     -- Admin confirmed payment is correct
  'payment_rejected', -- Admin rejected payment
  'donation',         -- User chose to donate instead of cancelling
  'cancelled',        -- Registration cancelled
  'cancel_pending',   -- Cancellation request pending admin review
  'cancel_accepted',  -- Admin accepted cancellation
  'cancel_rejected',  -- Admin rejected cancellation
  'confirmed',        -- Fully confirmed, tickets can be generated
  'checked_in',       -- Participant checked in at event
  'checked_out'       -- Participant checked out from event
);

-- Event participation roles
create type event_participation_role as enum (
  'participant',           -- Regular attendee
  -- Media team roles
  'volunteer_media_leader',       -- Trưởng ban Truyền thông
  'volunteer_media_sub_leader',   -- Phó ban Truyền thông
  'volunteer_media_member',       -- Thành viên ban Truyền thông
  -- Activity team roles
  'volunteer_activity_leader',    -- Trưởng ban Sinh hoạt
  'volunteer_activity_sub_leader',-- Phó ban Sinh hoạt
  'volunteer_activity_member',    -- Thành viên ban Sinh hoạt
  -- Discipline team roles
  'volunteer_discipline_leader',  -- Trưởng ban Kỷ luật
  'volunteer_discipline_sub_leader',-- Phó ban Kỷ luật
  'volunteer_discipline_member',  -- Thành viên ban Kỷ luật
  -- Logistics team roles
  'volunteer_logistics_leader',   -- Trưởng ban Hậu cần
  'volunteer_logistics_sub_leader',-- Phó ban Hậu cần
  'volunteer_logistics_member',   -- Thành viên ban Hậu cần
  -- Liturgy team roles
  'volunteer_liturgy_leader',     -- Trưởng ban Phụng vụ
  'volunteer_liturgy_sub_leader', -- Phó ban Phụng vụ
  'volunteer_liturgy_member',     -- Thành viên ban Phụng vụ
  -- Security team roles
  'volunteer_security_leader',    -- Trưởng ban An ninh
  'volunteer_security_sub_leader',-- Phó ban An ninh
  'volunteer_security_member',    -- Thành viên ban An ninh
  -- Registration team roles
  'volunteer_registration_leader',-- Trưởng ban Thư ký
  'volunteer_registration_sub_leader',-- Phó ban Thư ký
  'volunteer_registration_member',-- Thành viên ban Thư ký
  -- Catering team roles
  'volunteer_catering_leader',    -- Trưởng ban Ẩm thực
  'volunteer_catering_sub_leader',-- Phó ban Ẩm thực
  'volunteer_catering_member',    -- Thành viên ban Ẩm thực
  -- Health team roles
  'volunteer_health_leader',      -- Trưởng ban Y tế
  'volunteer_health_sub_leader',  -- Phó ban Y tế
  'volunteer_health_member',      -- Thành viên ban Y tế
  -- Audio Light team roles
  'volunteer_audio_light_leader', -- Trưởng ban Âm thanh Ánh sáng
  'volunteer_audio_light_sub_leader',-- Phó ban Âm thanh Ánh sáng
  'volunteer_audio_light_member', -- Thành viên ban Âm thanh Ánh sáng
  -- Group leadership roles
  'volunteer_group_leader',       -- Trưởng nhóm các đội
  'volunteer_group_sub_leader',   -- Phó trưởng nhóm các đội
  -- Organizer roles
  'organizer_core',               -- BAN TỔ CHỨC, THỦ QUỸ
  'organizer_regional',           -- BAN TỔ CHỨC KHU VỰC
  -- Special roles
  'speaker',                      -- Speaker/presenter
  'performer'                     -- Performer (choir, band, etc.)
);

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  region region_type,
  role user_role default 'participant',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on users table
alter table public.users enable row level security;

-- Create RLS policies for users
create policy "Users can view own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- Note: Admin access to users will be handled at the application level
-- to avoid circular RLS policy dependencies

-- Event configurations table
create table public.event_configs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  base_price decimal(10,2) default 0,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Registrations table
create table public.registrations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  event_config_id uuid references public.event_configs(id) on delete cascade,
  invoice_code text unique not null,
  status registration_status default 'pending',
  total_amount decimal(10,2) not null,
  participant_count integer not null default 1,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on registrations table
alter table public.registrations enable row level security;

-- Create RLS policies for registrations
create policy "Users can view own registrations" on public.registrations
  for select using (auth.uid() = user_id);

create policy "Users can create own registrations" on public.registrations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own registrations" on public.registrations
  for update using (auth.uid() = user_id);

create policy "Users can delete own registrations" on public.registrations
  for delete using (auth.uid() = user_id);

-- Note: Admin access to registrations will be handled at the application level
-- to avoid circular RLS policy dependencies

-- Registrants table (individual participants)
create table public.registrants (
  id uuid default uuid_generate_v4() primary key,
  registration_id uuid references public.registrations(id) on delete cascade not null,
  email text,  -- Optional for additional registrants
  saint_name text,
  full_name text not null,
  gender gender_type not null,
  age_group age_group_type not null,
  province text,  -- Optional for additional registrants
  diocese text,   -- Optional for additional registrants
  address text,   -- Optional for additional registrants
  facebook_link text,
  phone text,     -- Optional for additional registrants
  shirt_size shirt_size_type not null,
  event_role event_participation_role default 'participant',
  is_primary boolean default false,  -- Marks the main registrant (person who created registration)
  notes text,
  portrait_url text,
  group_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on registrants table
alter table public.registrants enable row level security;

-- Create RLS policies for registrants
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

-- Note: Admin access to registrants will be handled at the application level
-- to avoid circular RLS policy dependencies

-- Groups table
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  region region_type,
  max_participants integer,
  criteria jsonb, -- Store grouping rules as JSON
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add foreign key reference for group_id in registrants
alter table public.registrants add constraint fk_registrants_group_id
  foreign key (group_id) references public.groups(id);

-- Payment receipts table
create table public.receipts (
  id uuid default uuid_generate_v4() primary key,
  registration_id uuid references public.registrations(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  content_type text,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on receipts table
alter table public.receipts enable row level security;

-- Create RLS policies for receipts
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

-- Tickets table
create table public.tickets (
  id uuid default uuid_generate_v4() primary key,
  registrant_id uuid references public.registrants(id) on delete cascade not null,
  qr_code text not null,
  frame_url text,
  ticket_url text, -- Generated PDF URL
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tickets table
alter table public.tickets enable row level security;

-- Create RLS policies for tickets
create policy "Users can view own tickets" on public.tickets
  for select using (
    exists (
      select 1 from public.registrants
      join public.registrations on registrations.id = registrants.registration_id
      where registrants.id = tickets.registrant_id
      and registrations.user_id = auth.uid()
    )
);

-- Ticket frames table
create table public.ticket_frames (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  frame_url text not null,
  is_default boolean default false,
  region region_type,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Event agenda table
create table public.agenda_items (
  id uuid default uuid_generate_v4() primary key,
  event_config_id uuid references public.event_configs(id) on delete cascade,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  venue text,
  session_type text, -- workshop, plenary, break, etc.
  notes text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Functions to auto-update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_users_updated_at before update on public.users
  for each row execute function update_updated_at_column();

create trigger update_registrations_updated_at before update on public.registrations
  for each row execute function update_updated_at_column();

create trigger update_registrants_updated_at before update on public.registrants
  for each row execute function update_updated_at_column();

create trigger update_groups_updated_at before update on public.groups
  for each row execute function update_updated_at_column();

create trigger update_event_configs_updated_at before update on public.event_configs
  for each row execute function update_updated_at_column();

create trigger update_agenda_items_updated_at before update on public.agenda_items
  for each row execute function update_updated_at_column();

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to generate unique invoice codes
create or replace function generate_invoice_code()
returns text as $$
declare
  code text;
  exists_code boolean;
begin
  loop
    code := 'DH' || to_char(now(), 'YY') || '-' || lpad(floor(random() * 999999)::text, 6, '0');
    select exists(select 1 from public.registrations where invoice_code = code) into exists_code;
    if not exists_code then
      exit;
    end if;
  end loop;
  return code;
end;
$$ language plpgsql;

-- Storage buckets for file uploads
insert into storage.buckets (id, name, public) values 
  ('receipts', 'receipts', false),
  ('portraits', 'portraits', false),
  ('tickets', 'tickets', false),
  ('ticket-frames', 'ticket-frames', true);

-- Storage RLS policies
create policy "Users can upload their own receipts"
on storage.objects for insert
with check (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own receipts"
on storage.objects for select
using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload portraits"
on storage.objects for insert
with check (bucket_id = 'portraits' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view portraits"
on storage.objects for select
using (bucket_id = 'portraits');

create policy "Users can view their tickets"
on storage.objects for select
using (bucket_id = 'tickets' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Ticket frames are publicly viewable"
on storage.objects for select
using (bucket_id = 'ticket-frames');

-- Note: Admin access to ticket frames will be handled at the application level
-- 8. Create view for admin reporting by event roles
CREATE OR REPLACE VIEW registrant_role_summary AS
SELECT 
  r.event_role,
  COUNT(*) as total_count,
  COUNT(CASE WHEN reg.status = 'confirmed' THEN 1 END) as confirmed_count,
  COUNT(CASE WHEN reg.status = 'confirm_paid' THEN 1 END) as confirm_paid_count,
  COUNT(CASE WHEN reg.status = 'report_paid' THEN 1 END) as report_paid_count,
  COUNT(CASE WHEN reg.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN reg.status = 'payment_rejected' THEN 1 END) as payment_rejected_count,
  COUNT(CASE WHEN reg.status = 'checked_in' THEN 1 END) as checked_in_count
FROM public.registrants r
JOIN public.registrations reg ON reg.id = r.registration_id
GROUP BY r.event_role
ORDER BY total_count DESC;

-- 9. Grant permissions for the new view
GRANT SELECT ON registrant_role_summary TO authenticated;

-- 10. Create function to get role statistics
CREATE OR REPLACE FUNCTION get_role_statistics()
RETURNS TABLE (
  role_name text,
  role_label text,
  total_count bigint,
  confirmed_count bigint,
  paid_count bigint,
  pending_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.event_role::text as role_name,
    CASE r.event_role
      WHEN 'participant' THEN 'Tham dự viên'
      -- Media team roles
      WHEN 'volunteer_media_leader' THEN 'Trưởng ban Truyền thông'
      WHEN 'volunteer_media_sub_leader' THEN 'Phó ban Truyền thông'
      WHEN 'volunteer_media_member' THEN 'Thành viên ban Truyền thông'
      -- Activity team roles
      WHEN 'volunteer_activity_leader' THEN 'Trưởng ban Sinh hoạt'
      WHEN 'volunteer_activity_sub_leader' THEN 'Phó ban Sinh hoạt'
      WHEN 'volunteer_activity_member' THEN 'Thành viên ban Sinh hoạt'
      -- Discipline team roles
      WHEN 'volunteer_discipline_leader' THEN 'Trưởng ban Kỷ luật'
      WHEN 'volunteer_discipline_sub_leader' THEN 'Phó ban Kỷ luật'
      WHEN 'volunteer_discipline_member' THEN 'Thành viên ban Kỷ luật'
      -- Logistics team roles
      WHEN 'volunteer_logistics_leader' THEN 'Trưởng ban Hậu cần'
      WHEN 'volunteer_logistics_sub_leader' THEN 'Phó ban Hậu cần'
      WHEN 'volunteer_logistics_member' THEN 'Thành viên ban Hậu cần'
      -- Liturgy team roles
      WHEN 'volunteer_liturgy_leader' THEN 'Trưởng ban Phụng vụ'
      WHEN 'volunteer_liturgy_sub_leader' THEN 'Phó ban Phụng vụ'
      WHEN 'volunteer_liturgy_member' THEN 'Thành viên ban Phụng vụ'
      -- Security team roles
      WHEN 'volunteer_security_leader' THEN 'Trưởng ban An ninh'
      WHEN 'volunteer_security_sub_leader' THEN 'Phó ban An ninh'
      WHEN 'volunteer_security_member' THEN 'Thành viên ban An ninh'
      -- Registration team roles
      WHEN 'volunteer_registration_leader' THEN 'Trưởng ban Thư ký'
      WHEN 'volunteer_registration_sub_leader' THEN 'Phó ban Thư ký'
      WHEN 'volunteer_registration_member' THEN 'Thành viên ban Thư ký'
      -- Catering team roles
      WHEN 'volunteer_catering_leader' THEN 'Trưởng ban Ẩm thực'
      WHEN 'volunteer_catering_sub_leader' THEN 'Phó ban Ẩm thực'
      WHEN 'volunteer_catering_member' THEN 'Thành viên ban Ẩm thực'
      -- Health team roles
      WHEN 'volunteer_health_leader' THEN 'Trưởng ban Y tế'
      WHEN 'volunteer_health_sub_leader' THEN 'Phó ban Y tế'
      WHEN 'volunteer_health_member' THEN 'Thành viên ban Y tế'
      -- Audio Light team roles
      WHEN 'volunteer_audio_light_leader' THEN 'Trưởng ban Âm thanh Ánh sáng'
      WHEN 'volunteer_audio_light_sub_leader' THEN 'Phó ban Âm thanh Ánh sáng'
      WHEN 'volunteer_audio_light_member' THEN 'Thành viên ban Âm thanh Ánh sáng'
      -- Group leadership roles
      WHEN 'volunteer_group_leader' THEN 'Trưởng nhóm các đội'
      WHEN 'volunteer_group_sub_leader' THEN 'Phó trưởng nhóm các đội'
      -- Organizer roles
      WHEN 'organizer_core' THEN 'Ban Tổ chức chính'
      WHEN 'organizer_regional' THEN 'Ban Tổ chức khu vực'
      -- Special roles
      WHEN 'speaker' THEN 'Diễn giả'
      WHEN 'performer' THEN 'Nghệ sĩ biểu diễn'
      ELSE r.event_role::text
    END as role_label,
    COUNT(*) as total_count,
    COUNT(CASE WHEN reg.status = 'confirmed' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN reg.status IN ('report_paid', 'confirm_paid') THEN 1 END) as paid_count,
    COUNT(CASE WHEN reg.status = 'pending' THEN 1 END) as pending_count
  FROM public.registrants r
  JOIN public.registrations reg ON reg.id = r.registration_id
  GROUP BY r.event_role
  ORDER BY total_count DESC;
END;
$$;

-- 11. Create RLS policy for role statistics function
GRANT EXECUTE ON FUNCTION get_role_statistics() TO authenticated;

-- Success message
SELECT 'Database migration completed successfully!' as message;
