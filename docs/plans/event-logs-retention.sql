-- Log retention policy: delete logs older than 90 days
DELETE FROM event_logs WHERE created_at < NOW() - INTERVAL '90 days';
-- Schedule this query to run daily via Supabase scheduled tasks or cron.
