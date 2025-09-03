-- Fix LinkedIn growth metrics: Process existing verified evidence and insert missing metrics
-- This addresses the issue where verified LinkedIn tasks with tracking metrics 
-- weren't properly processed into the linkedin_network_metrics table

-- Insert missing LinkedIn network metrics from verified evidence (aggregating duplicates)
INSERT INTO linkedin_network_metrics (user_id, date, activity_id, value, created_at, updated_at)
SELECT 
  lut.user_id,
  le.created_at::date as date,
  activity_id,
  SUM(value) as total_value,
  NOW() as created_at,
  NOW() as updated_at
FROM (
  SELECT DISTINCT
    lut.user_id,
    le.created_at,
    le.id as evidence_id,
    CASE 
      WHEN metrics_type = 'connections_accepted' THEN 'connections_accepted'
      WHEN metrics_type = 'posts_count' THEN 'create_post'
      WHEN metrics_type = 'profile_views' THEN 'profile_views'
    END as activity_id,
    CASE 
      WHEN metrics_type = 'connections_accepted' THEN (le.evidence_data->'tracking_metrics'->>'connections_accepted')::integer
      WHEN metrics_type = 'posts_count' THEN (le.evidence_data->'tracking_metrics'->>'posts_count')::integer
      WHEN metrics_type = 'profile_views' THEN (le.evidence_data->'tracking_metrics'->>'profile_views')::integer
    END as value
  FROM linkedin_evidence le
  JOIN linkedin_user_tasks lut ON le.user_task_id = lut.id
  CROSS JOIN (
    VALUES ('connections_accepted'), ('posts_count'), ('profile_views')
  ) AS metrics_types(metrics_type)
  WHERE lut.status = 'VERIFIED'
    AND le.evidence_data IS NOT NULL
    AND le.evidence_data->'tracking_metrics' IS NOT NULL
    AND CASE 
      WHEN metrics_type = 'connections_accepted' THEN (le.evidence_data->'tracking_metrics'->>'connections_accepted')::integer > 0
      WHEN metrics_type = 'posts_count' THEN (le.evidence_data->'tracking_metrics'->>'posts_count')::integer > 0
      WHEN metrics_type = 'profile_views' THEN (le.evidence_data->'tracking_metrics'->>'profile_views')::integer > 0
    END
) AS metrics_data
JOIN linkedin_user_tasks lut ON lut.user_id = metrics_data.user_id
JOIN linkedin_evidence le ON le.id = metrics_data.evidence_id
GROUP BY lut.user_id, le.created_at::date, activity_id
ON CONFLICT (user_id, date, activity_id) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();