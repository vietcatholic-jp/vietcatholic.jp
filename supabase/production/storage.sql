-- Production Storage and Indexes
-- Storage buckets, indexes, and performance optimizations

-- Storage buckets for file uploads
insert into storage.buckets (id, name, public) values 
  ('receipts', 'receipts', false),
  ('portraits', 'portraits', false),
  ('tickets', 'tickets', false),
  ('ticket-frames', 'ticket-frames', true);

-- Create indexes for better performance
create index idx_users_email on public.users(email);
create index idx_users_role on public.users(role);
create index idx_users_region on public.users(region);

create index idx_registrations_user_id on public.registrations(user_id);
create index idx_registrations_event_config_id on public.registrations(event_config_id);
create index idx_registrations_status on public.registrations(status);
create index idx_registrations_invoice_code on public.registrations(invoice_code);

create index idx_registrants_registration_id on public.registrants(registration_id);
create index idx_registrants_event_role on public.registrants(event_role);
create index idx_registrants_group_id on public.registrants(group_id);
create index idx_registrants_is_primary on public.registrants(is_primary);

create index idx_receipts_registration_id on public.receipts(registration_id);

create index idx_tickets_registrant_id on public.tickets(registrant_id);
create index idx_tickets_qr_code on public.tickets(qr_code);

create index idx_cancel_requests_registration_id on public.cancel_requests(registration_id);
create index idx_cancel_requests_user_id on public.cancel_requests(user_id);
create index idx_cancel_requests_status on public.cancel_requests(status);

create index idx_transportation_groups_region on public.transportation_groups(region);
create index idx_transportation_groups_created_by on public.transportation_groups(created_by);
create index idx_transportation_groups_status on public.transportation_groups(status);

create index idx_transportation_registrations_group_id on public.transportation_registrations(transportation_group_id);
create index idx_transportation_registrations_registrant_id on public.transportation_registrations(registrant_id);
create index idx_transportation_registrations_registered_by on public.transportation_registrations(registered_by);

create index idx_agenda_items_event_config_id on public.agenda_items(event_config_id);
create index idx_agenda_items_start_time on public.agenda_items(start_time);
create index idx_agenda_items_sort_order on public.agenda_items(sort_order);

create index idx_event_configs_is_active on public.event_configs(is_active);
create index idx_event_configs_start_date on public.event_configs(start_date);

create index idx_groups_region on public.groups(region);
