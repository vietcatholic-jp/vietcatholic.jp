-- Migration to make event configuration more flexible.

-- Drop dependent objects first
drop view if exists public.registrant_role_summary cascade;

-- Drop the old event_role column from registrants table
alter table public.registrants drop column if exists event_role cascade;

-- Drop the old event_participation_role enum
drop type if exists public.event_participation_role cascade;

-- Create a new table for event-specific teams
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

-- Create a new table for event-specific roles
create table public.event_roles (
  id uuid default uuid_generate_v4() primary key,
  event_config_id uuid references public.event_configs(id) on delete cascade not null,
  name text not null,
  description text,
  permissions jsonb, -- For future use, e.g. { "can_check_in": true }
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique(event_config_id, name)
);

-- Add new columns to event_configs table
alter table public.event_configs
  add column if not exists total_slots integer,
  add column if not exists registered_count integer default 0,
  add column if not exists cancelled_count integer default 0,
  add column if not exists checked_in_count integer default 0;

-- Update registrants table
-- Add new columns for team and role references
alter table public.registrants
  add column if not exists event_team_id uuid references public.event_teams(id) on delete set null,
  add column if not exists event_role_id uuid references public.event_roles(id) on delete set null;

-- Create a junction table for team members if a registrant can be in multiple teams (more flexible)
-- For now, assuming a registrant is in one team.

-- Create functions to update the new count columns in event_configs
create or replace function update_event_counts()
returns trigger as $$
declare
  v_event_config_id uuid;
begin
  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    v_event_config_id := new.event_config_id;
  elsif (tg_op = 'DELETE') then
    v_event_config_id := old.event_config_id;
  end if;

  if v_event_config_id is not null then
    update public.event_configs
    set
      registered_count = (
        select coalesce(sum(participant_count), 0) from public.registrations
        where event_config_id = v_event_config_id and status in ('confirm_paid', 'confirmed', 'checked_in')
      ),
      cancelled_count = (
        select coalesce(sum(participant_count), 0) from public.registrations
        where event_config_id = v_event_config_id and status in ('cancelled', 'cancel_accepted')
      ),
      checked_in_count = (
        select coalesce(sum(participant_count), 0) from public.registrations
        where event_config_id = v_event_config_id and status = 'checked_in'
      )
    where id = v_event_config_id;
  end if;

  return null; -- result is ignored since this is an AFTER trigger
end;
$$ language plpgsql;

-- Create a trigger to automatically update counts when registration status changes
create trigger on_registration_change
  after insert or update or delete on public.registrations
  for each row execute function update_event_counts();

-- Populate event_roles table with existing roles for active event
do $$
declare
  v_event_config_id uuid;
begin
  -- Get the active event config
  select id into v_event_config_id from public.event_configs where is_active = true limit 1;
  
  if v_event_config_id is not null then
    -- Insert all the event roles based on the old enum structure
    insert into public.event_roles (event_config_id, name, description) values
    -- Media team roles
    (v_event_config_id, 'Trưởng ban Truyền thông', 'Chịu trách nhiệm điều phối toàn bộ hoạt động truyền thông của sự kiện'),
    (v_event_config_id, 'Phó ban Truyền thông', 'Hỗ trợ trưởng ban trong việc quản lý các hoạt động truyền thông'),
    (v_event_config_id, 'Thành viên ban Truyền thông', 'Thực hiện các công việc truyền thông như chụp ảnh, quay video, đăng bài'),
    
    -- Activity team roles
    (v_event_config_id, 'Trưởng ban Sinh hoạt', 'Chịu trách nhiệm tổ chức và điều phối các hoạt động sinh hoạt'),
    (v_event_config_id, 'Phó ban Sinh hoạt', 'Hỗ trợ trưởng ban trong việc tổ chức các hoạt động sinh hoạt'),
    (v_event_config_id, 'Thành viên ban Sinh hoạt', 'Thực hiện các hoạt động sinh hoạt, trò chơi, văn nghệ'),
    
    -- Discipline team roles
    (v_event_config_id, 'Trưởng ban Kỷ luật', 'Chịu trách nhiệm duy trì trật tự và kỷ luật trong sự kiện'),
    (v_event_config_id, 'Phó ban Kỷ luật', 'Hỗ trợ trưởng ban trong việc duy trì trật tự'),
    (v_event_config_id, 'Thành viên ban Kỷ luật', 'Thực hiện nhiệm vụ giữ gìn trật tự, hướng dẫn người tham gia'),
    
    -- Logistics team roles
    (v_event_config_id, 'Trưởng ban Hậu cần', 'Chịu trách nhiệm tổ chức và quản lý các hoạt động hậu cần'),
    (v_event_config_id, 'Phó ban Hậu cần', 'Hỗ trợ trưởng ban trong việc quản lý hậu cần'),
    (v_event_config_id, 'Thành viên ban Hậu cần', 'Thực hiện các công việc hậu cần như vận chuyển, chuẩn bị vật dụng'),
    
    -- Liturgy team roles
    (v_event_config_id, 'Trưởng ban Phụng vụ', 'Chịu trách nhiệm tổ chức và điều phối các hoạt động phụng vụ'),
    (v_event_config_id, 'Phó ban Phụng vụ', 'Hỗ trợ trưởng ban trong việc tổ chức phụng vụ'),
    (v_event_config_id, 'Thành viên ban Phụng vụ', 'Thực hiện các nhiệm vụ phụng vụ như ca đoàn, đọc sách, rước lễ'),
    
    -- Security team roles
    (v_event_config_id, 'Trưởng ban An ninh', 'Chịu trách nhiệm đảm bảo an toàn và an ninh cho sự kiện'),
    (v_event_config_id, 'Phó ban An ninh', 'Hỗ trợ trưởng ban trong việc đảm bảo an ninh'),
    (v_event_config_id, 'Thành viên ban An ninh', 'Thực hiện nhiệm vụ bảo vệ, kiểm soát ra vào'),
    
    -- Registration team roles
    (v_event_config_id, 'Trưởng ban Thư ký', 'Chịu trách nhiệm quản lý đăng ký và thông tin người tham gia'),
    (v_event_config_id, 'Phó ban Thư ký', 'Hỗ trợ trưởng ban trong việc quản lý đăng ký'),
    (v_event_config_id, 'Thành viên ban Thư ký', 'Thực hiện các công việc đăng ký, check-in, quản lý thông tin'),
    
    -- Catering team roles
    (v_event_config_id, 'Trưởng ban Ẩm thực', 'Chịu trách nhiệm tổ chức và quản lý các hoạt động ẩm thực'),
    (v_event_config_id, 'Phó ban Ẩm thực', 'Hỗ trợ trưởng ban trong việc quản lý ẩm thực'),
    (v_event_config_id, 'Thành viên ban Ẩm thực', 'Thực hiện các công việc nấu ăn, phục vụ, dọn dẹp'),
    
    -- Health team roles
    (v_event_config_id, 'Trưởng ban Y tế', 'Chịu trách nhiệm chăm sóc sức khỏe người tham gia'),
    (v_event_config_id, 'Phó ban Y tế', 'Hỗ trợ trưởng ban trong việc chăm sóc y tế'),
    (v_event_config_id, 'Thành viên ban Y tế', 'Thực hiện các công việc sơ cứu, chăm sóc sức khỏe'),
    
    -- Audio Light team roles
    (v_event_config_id, 'Trưởng ban Âm thanh Ánh sáng', 'Chịu trách nhiệm quản lý hệ thống âm thanh và ánh sáng'),
    (v_event_config_id, 'Phó ban Âm thanh Ánh sáng', 'Hỗ trợ trưởng ban trong việc quản lý âm thanh ánh sáng'),
    (v_event_config_id, 'Thành viên ban Âm thanh Ánh sáng', 'Thực hiện các công việc kỹ thuật âm thanh và ánh sáng'),
    
    -- Group leadership roles
    (v_event_config_id, 'Trưởng nhóm các đội', 'Chịu trách nhiệm điều phối hoạt động giữa các đội'),
    (v_event_config_id, 'Phó trưởng nhóm các đội', 'Hỗ trợ trưởng nhóm trong việc điều phối'),
    
    -- Organizer roles
    (v_event_config_id, 'Ban tổ chức cốt cán', 'Thành viên ban tổ chức cốt cán, thủ quỹ'),
    (v_event_config_id, 'Ban tổ chức khu vực', 'Thành viên ban tổ chức khu vực');
    
    raise notice 'Successfully populated event_roles table with % roles for event %', 
      (select count(*) from public.event_roles where event_config_id = v_event_config_id), 
      v_event_config_id;
  else
    raise notice 'No active event found - skipping event_roles population';
  end if;
end $$;

select 'Migration for flexible event structure applied successfully!' as message;
