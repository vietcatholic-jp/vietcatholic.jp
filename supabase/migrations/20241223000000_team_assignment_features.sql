-- Team Assignment Features Migration
-- This migration adds the core functionality for team assignment system

-- Add event_team_id column to registrants table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrants' 
        AND column_name = 'event_team_id'
    ) THEN
        ALTER TABLE registrants 
        ADD COLUMN event_team_id uuid REFERENCES event_teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_registrants_event_team_id ON registrants(event_team_id);
CREATE INDEX IF NOT EXISTS idx_registrants_unassigned ON registrants(event_team_id) WHERE event_team_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_registrants_search ON registrants(full_name, province, gender, age_group);

-- Function to validate team assignment
CREATE OR REPLACE FUNCTION validate_team_assignment(
    p_registrant_id uuid,
    p_team_id uuid
) RETURNS boolean AS $$
DECLARE
    registrant_event_id uuid;
    team_event_id uuid;
    current_team_size integer;
    team_capacity integer;
BEGIN
    -- Get registrant's event ID
    SELECT r.registration_id INTO registrant_event_id
    FROM registrants r
    JOIN registrations reg ON r.registration_id = reg.id
    WHERE r.id = p_registrant_id;
    
    -- Get team's event ID and capacity
    SELECT event_config_id INTO team_event_id
    FROM event_teams
    WHERE id = p_team_id;
    
    -- Check if registrant and team belong to same event
    IF registrant_event_id IS NULL OR team_event_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get current team size and capacity
    SELECT COUNT(*), et.capacity
    INTO current_team_size, team_capacity
    FROM registrants r
    CROSS JOIN event_teams et
    WHERE r.event_team_id = p_team_id
    AND et.id = p_team_id
    GROUP BY et.capacity;
    
    -- Check capacity (allow if current size is less than capacity)
    IF team_capacity IS NOT NULL AND current_team_size >= team_capacity THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for team assignment
ALTER TABLE registrants ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage team assignments
CREATE POLICY "Admins can manage team assignments" ON registrants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role IN ('super_admin','registration_manager', 'event_organizer', 'regional_admin')
        )
);

-- Policy for users to view their own registrants
CREATE POLICY "Users can view own registrants" ON registrants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM registrations r
            WHERE r.id = registrants.registration_id
            AND r.user_id = auth.uid()
        )
    );

-- Function to get team statistics
CREATE OR REPLACE FUNCTION get_team_stats()
RETURNS TABLE (
    total_teams bigint,
    total_assigned bigint,
    total_unassigned bigint,
    team_distribution jsonb,
    gender_distribution jsonb,
    age_distribution jsonb
) AS $$
BEGIN
    RETURN QUERY
    WITH team_counts AS (
        SELECT 
            et.name as team_name,
            COUNT(r.id) as member_count
        FROM event_teams et
        LEFT JOIN registrants r ON r.event_team_id = et.id
        GROUP BY et.id, et.name
    ),
    gender_counts AS (
        SELECT 
            r.gender,
            COUNT(*) as count
        FROM registrants r
        WHERE r.event_team_id IS NOT NULL
        GROUP BY r.gender
    ),
    age_counts AS (
        SELECT 
            r.age_group,
            COUNT(*) as count
        FROM registrants r
        WHERE r.event_team_id IS NOT NULL
        GROUP BY r.age_group
    )
    SELECT 
        (SELECT COUNT(*) FROM event_teams)::bigint as total_teams,
        (SELECT COUNT(*) FROM registrants WHERE event_team_id IS NOT NULL)::bigint as total_assigned,
        (SELECT COUNT(*) FROM registrants WHERE event_team_id IS NULL)::bigint as total_unassigned,
        (SELECT jsonb_agg(jsonb_build_object('team_name', team_name, 'count', member_count)) FROM team_counts) as team_distribution,
        (SELECT jsonb_agg(jsonb_build_object('gender', gender, 'count', count)) FROM gender_counts) as gender_distribution,
        (SELECT jsonb_agg(jsonb_build_object('age_group', age_group, 'count', count)) FROM age_counts) as age_distribution;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_team_assignment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_stats() TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
