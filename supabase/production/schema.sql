-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('participant', -- Người tham gia
  'volunteer', -- Tình nguyện viên
  'volunteer_leader', -- Trưởng ban tình nguyện
  'volunteer_sub_leader', -- Phó ban tình nguyện
  'organizer', -- Ban tổ chức
  'organizer_core', -- Ban tổ chức cốt lõi
  'organizer_regional', -- Ban tổ chức khu vực
  'admin', -- Quản trị viên
  'registration_manager', -- Quản lý đăng ký
  'event_organizer', -- Người tổ chức sự kiện
  'group_leader', -- Trưởng nhóm các đội
  'regional_admin', -- Quản trị viên khu vực
  'super_admin' -- Quản trị viên cao cấp
);
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
																									
-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  region region_type,
  role user_role default 'participant',
  facebook_url text,
  province text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add comments for documentation
comment on column public.users.facebook_url is 'User Facebook profile URL from OAuth login';
comment on column public.users.province is 'User province in Japan (e.g., Tokyo, Osaka, etc.)';

-- Note: RLS policies are defined in policies.sql

-- Event configurations table
create table public.event_configs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  base_price decimal(10,2) default 0,
  deadline_payment integer default 10, -- Days from registration date to pay
  is_active boolean default false,
  cancellation_deadline timestamptz,
  total_slots integer,
  registered_count integer default 0,
  cancelled_count integer default 0,
  checked_in_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add comment for documentation
comment on column public.event_configs.cancellation_deadline is 'Deadline for users to cancel their paid registrations';

-- Event teams table
create table public.event_teams (
  id uuid default uuid_generate_v4() primary key,
  event_config_id uuid references public.event_configs(id) on delete cascade not null,
  name text not null,
  description text,
  leader_id uuid references public.users(id),
  sub_leader_id uuid references public.users(id),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique(event_config_id, name)
);

comment on column public.event_teams.leader_id is 'User ID of the team leader';
comment on column public.event_teams.sub_leader_id is 'User ID of the team sub-leader';

-- Event roles table
create table public.event_roles (
  id uuid default uuid_generate_v4() primary key,
  event_config_id uuid references public.event_configs(id) on delete cascade not null,
  name text not null,
  description text,
  team_name text, -- Optional team name this role belongs to
  permissions jsonb, -- For future use, e.g. { "can_check_in": true }
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique(event_config_id, name)
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

-- Note: RLS policies are defined in policies.sql

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
  event_team_id uuid references public.event_teams(id) on delete set null,
  event_role_id uuid references public.event_roles(id) on delete set null,
  is_primary boolean default false,  -- Marks the main registrant (person who created registration)
  notes text,
  portrait_url text,
  group_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: RLS policies are defined in policies.sql

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

-- Note: RLS policies are defined in policies.sql

-- Tickets table
create table public.tickets (
  id uuid default uuid_generate_v4() primary key,
  registrant_id uuid references public.registrants(id) on delete cascade not null,
  qr_code text not null,
  frame_url text,
  ticket_url text, -- Generated PDF URL
  generated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: RLS policies are defined in policies.sql

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

-- Cancel requests table
create table public.cancel_requests (
  id uuid default uuid_generate_v4() primary key,
  registration_id uuid references public.registrations(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  reason text not null,
  bank_account_number text not null,
  bank_name text not null,
  account_holder_name text not null,
  refund_amount decimal(10,2) not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'processed')),
  processed_at timestamp with time zone,
  processed_by uuid references public.users(id),
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: RLS policies are defined in policies.sql

-- Transportation groups table
create table public.transportation_groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  region region_type not null,
  departure_location text not null,
  departure_time timestamp with time zone not null,
  arrival_location text default 'Venue Location',
  capacity integer not null default 45,
  current_count integer default 0,
  vehicle_type text default 'bus', -- bus, van, train, etc.
  contact_person text,
  contact_phone text,
  notes text,
  status text default 'active' check (status in ('active', 'full', 'cancelled')),
  created_by uuid references public.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: RLS policies are defined in policies.sql

-- Transportation registrations junction table
create table public.transportation_registrations (
  id uuid default uuid_generate_v4() primary key,
  transportation_group_id uuid references public.transportation_groups(id) on delete cascade not null,
  registrant_id uuid references public.registrants(id) on delete cascade not null,
  registered_by uuid references public.users(id) not null,
  emergency_contact_name text,
  emergency_contact_phone text,
  special_needs text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure a registrant can only be in one transport group
  unique(registrant_id)
);

-- Note: RLS policies are defined in policies.sql

-- Function to update event counts
create or replace function update_event_counts()
returns trigger as $$
declare
  v_event_config_id uuid;
begin
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    select event_config_id into v_event_config_id from public.registrations where id = new.registration_id;
  elsif (tg_op = 'DELETE') then
    select event_config_id into v_event_config_id from public.registrations where id = old.registration_id;
  end if;

  if v_event_config_id is not null then
    update public.event_configs
    set
      registered_count = (
        select count(*) from public.registrations
        where event_config_id = v_event_config_id and status in ('confirm_paid', 'confirmed', 'checked_in')
      ),
      cancelled_count = (
        select count(*) from public.registrations
        where event_config_id = v_event_config_id and status in ('cancelled', 'cancel_accepted')
      ),
      checked_in_count = (
        select count(*) from public.registrations
        where event_config_id = v_event_config_id and status = 'checked_in'
      )
    where id = v_event_config_id;
  end if;

  return null; -- result is ignored since this is an AFTER trigger
end;
$$ language plpgsql;

-- Create trigger to automatically update counts when registration status changes
create trigger on_registration_change
  after insert or update or delete on public.registrations
  for each row execute function update_event_counts();

-- Success message
select 'Database schema created successfully for production!' as message;
