-- Production Triggers
-- All database triggers consolidated in one file

-- Create triggers for updated_at timestamps
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

create trigger update_cancel_requests_updated_at before update on public.cancel_requests
  for each row execute function update_updated_at_column();

create trigger update_transportation_groups_updated_at before update on public.transportation_groups
  for each row execute function update_updated_at_column();

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create triggers for transportation group count management
create trigger update_transportation_count_on_insert
  after insert on public.transportation_registrations
  for each row execute function update_transportation_group_count();

create trigger update_transportation_count_on_delete
  after delete on public.transportation_registrations
  for each row execute function update_transportation_group_count();
