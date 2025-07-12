-- Production Functions
-- All database functions consolidated in one file

-- Function to auto-update updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

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

-- Helper functions for admin roles (to avoid RLS recursion)
create or replace function is_admin_user(user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role user_role;
begin
  select role into user_role from public.users where id = user_id;
  return user_role in ('super_admin', 'regional_admin', 'event_organizer', 'group_leader', 'registration_manager');
end;
$$;

create or replace function is_super_or_regional_admin(user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role user_role;
begin
  select role into user_role from public.users where id = user_id;
  return user_role in ('super_admin', 'regional_admin', 'registration_manager');
end;
$$;

-- Function to update transportation group current_count
create or replace function update_transportation_group_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.transportation_groups 
    set current_count = current_count + 1,
        updated_at = now()
    where id = new.transportation_group_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.transportation_groups 
    set current_count = current_count - 1,
        updated_at = now()
    where id = old.transportation_group_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

-- Function to get registration statistics
create or replace function get_registration_stats()
returns table (
  total_registrations bigint,
  pending_payments bigint,
  confirmed_registrations bigint,
  rejected_payments bigint,
  cancel_requests bigint,
  total_amount numeric,
  confirmed_amount numeric
)
language plpgsql
as $$
begin
  return query
  select
    coalesce(sum(registrations.participant_count), 0) as total_registrations,
    coalesce(count(*) filter (where registrations.status = 'report_paid'), 0) as pending_payments,
    coalesce(count(*) filter (where registrations.status in ('confirm_paid', 'confirmed')), 0) as confirmed_registrations,
    coalesce(count(*) filter (where registrations.status = 'payment_rejected'), 0) as rejected_payments,
    coalesce((select count(*) from cancel_requests where cancel_requests.status = 'pending'), 0) as cancel_requests,
    coalesce(sum(registrations.total_amount) filter (where registrations.status in ('pending','report_paid','donation','confirm_paid', 'confirmed','checked_in','checked_out')), 0) as total_amount,
    coalesce(sum(registrations.total_amount) filter (where registrations.status in ('donation','confirm_paid', 'confirmed','checked_in','checked_out')), 0) as confirmed_amount
  from registrations;
end;
$$;

-- Function to get role statistics
create or replace function get_role_statistics()
returns table (
  role_name text,
  role_label text,
  total_count bigint,
  confirmed_count bigint,
  paid_count bigint,
  pending_count bigint
) 
language plpgsql
security definer
as $$
begin
  return query
  select 
    r.event_role::text as role_name,
    case r.event_role
      when 'participant' then 'Người tham gia'
      when 'volunteer_media' then 'Ban Truyền thông'
      when 'volunteer_logistics' then 'Ban Hậu cần'
      when 'volunteer_liturgy' then 'Ban Phụng vụ'
      when 'volunteer_security' then 'Ban An ninh'
      when 'volunteer_registration' then 'Ban Đăng ký'
      when 'volunteer_catering' then 'Ban Ẩm thực'
      when 'organizer_core' then 'Ban Tổ chức chính'
      when 'organizer_regional' then 'Ban Tổ chức khu vực'
      when 'speaker' then 'Diễn giả'
      when 'performer' then 'Nghệ sĩ biểu diễn'
      else r.event_role::text
    end as role_label,
    count(*) as total_count,
    count(case when reg.status = 'confirmed' then 1 end) as confirmed_count,
    count(case when reg.status in ('report_paid', 'confirm_paid') then 1 end) as paid_count,
    count(case when reg.status = 'pending' then 1 end) as pending_count
  from public.registrants r
  join public.registrations reg on reg.id = r.registration_id
  group by r.event_role
  order by total_count desc;
end;
$$;

-- Grant execute permissions
grant execute on function get_role_statistics() to authenticated;
grant execute on function get_registration_stats() to authenticated;
