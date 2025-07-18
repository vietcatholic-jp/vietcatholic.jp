-- Critical errors in last 24 hours
SELECT 
  event_type,
  COUNT(*) as error_count,
  COUNT(DISTINCT user_id) as affected_users,
  MAX(created_at) as last_occurrence
FROM event_logs 
WHERE severity = 'critical' 
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY error_count DESC;

-- Registration funnel analysis
WITH registration_events AS (
  SELECT 
    user_id,
    event_type,
    created_at,
    registration_id
  FROM event_logs 
  WHERE event_category = 'registration'
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT 
  COUNT(CASE WHEN event_type = 'registration_started' THEN 1 END) as started,
  COUNT(CASE WHEN event_type = 'registration_created' THEN 1 END) as completed,
  COUNT(CASE WHEN event_type = 'registration_failed' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN event_type = 'registration_created' THEN 1 END)::decimal / 
    NULLIF(COUNT(CASE WHEN event_type = 'registration_started' THEN 1 END), 0) * 100, 
    2
  ) as completion_rate
FROM registration_events;

-- Most common validation errors
SELECT 
  event_data->>'fieldName' as field_name,
  event_data->>'errorMessage' as error_message,
  COUNT(*) as frequency
FROM event_logs 
WHERE event_type = 'registrant_validation_error'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY field_name, error_message
ORDER BY frequency DESC
LIMIT 20;

-- Slow API endpoints
SELECT 
  endpoint,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration,
  COUNT(*) as request_count
FROM event_logs 
WHERE duration_ms IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint
HAVING AVG(duration_ms) > 5000  -- 5 seconds
ORDER BY avg_duration DESC;

-- Error rate by endpoint
SELECT 
  endpoint,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN severity IN ('error', 'critical') THEN 1 END) as error_count,
  ROUND(
    COUNT(CASE WHEN severity IN ('error', 'critical') THEN 1 END)::decimal / 
    COUNT(*) * 100, 
    2
  ) as error_rate
FROM event_logs 
WHERE endpoint IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint
HAVING COUNT(*) > 10  -- Only endpoints with significant traffic
ORDER BY error_rate DESC;
