-- Production Views
-- All database views consolidated in one file

-- Create view for admin reporting by event roles
create or replace view registrant_role_summary as
select 
  r.event_role,
  count(*) as total_count,
  count(case when reg.status = 'confirmed' then 1 end) as confirmed_count,
  count(case when reg.status = 'confirm_paid' then 1 end) as confirm_paid_count,
  count(case when reg.status = 'report_paid' then 1 end) as report_paid_count,
  count(case when reg.status = 'pending' then 1 end) as pending_count,
  count(case when reg.status = 'payment_rejected' then 1 end) as payment_rejected_count,
  count(case when reg.status = 'checked_in' then 1 end) as checked_in_count
from public.registrants r
join public.registrations reg on reg.id = r.registration_id
group by r.event_role
order by total_count desc;

-- Grant permissions for the view
grant select on registrant_role_summary to authenticated;
