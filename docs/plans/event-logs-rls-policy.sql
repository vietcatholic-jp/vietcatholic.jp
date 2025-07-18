-- Row Level Security policy for event_logs table
-- Only allow super_admin and event_organizer roles to view logs
CREATE POLICY "Allow admin log access" ON event_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = event_logs.user_id AND users.role IN ('super_admin', 'event_organizer')
    )
  );

ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
