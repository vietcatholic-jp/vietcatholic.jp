create or replace function get_registration_stats()
returns table (
	total_registrations bigint,
	pending_payments bigint,
	confirmed_registrations bigint,
	rejected_payments bigint,
	cancel_requests bigint,
	total_amount numeric,
	confirmed_amount numeric,
	total_participants bigint,
	checked_in_participants bigint
)
language plpgsql
as $$
begin
	return query
	select
		coalesce(sum(registrations.participant_count), 0) as total_registrations,
		coalesce(count(*) filter (where registrations.status = 'pending'), 0) as pending_payments,
		coalesce(count(*) filter (where registrations.status in ('confirm_paid', 'confirmed')), 0) as confirmed_registrations,
		coalesce(count(*) filter (where registrations.status = 'payment_rejected'), 0) as rejected_payments,
		coalesce((select count(*) from cancel_requests where cancel_requests.status = 'pending'), 0) as cancel_requests,
		coalesce(sum(registrations.total_amount) filter (where registrations.status in ('pending','report_paid','donation','confirm_paid', 'confirmed','checked_in','checked_out')), 0) as total_amount,
		coalesce(sum(registrations.total_amount) filter (where registrations.status in ('donation','confirm_paid', 'confirmed','checked_in','checked_out')), 0) as confirmed_amount,
		coalesce((select count(*) from registrants where registration_id in (select id from registrations where status in ('pending','report_paid','donation','confirm_paid', 'confirmed','checked_in','checked_out'))), 0) as total_participants,
		coalesce((select count(*) from registrants where is_checked_in = true), 0) as checked_in_participants
	from registrations;
end;
$$;
