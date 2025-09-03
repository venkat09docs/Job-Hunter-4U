-- Process tracking metrics for existing verified LinkedIn task
-- Insert the metrics from the already approved task that wasn't processed

INSERT INTO linkedin_network_metrics (user_id, date, activity_id, value, created_at, updated_at)
SELECT 
  lut.user_id,
  CURRENT_DATE as date,
  CASE 
    WHEN activity_type = 'connections_accepted' THEN 'connections_accepted'
    WHEN activity_type = 'posts_count' THEN 'create_post'  
    WHEN activity_type = 'profile_views' THEN 'profile_views'
  END as activity_id,
  CASE 
    WHEN activity_type = 'connections_accepted' THEN (le.evidence_data->'tracking_metrics'->>'connections_accepted')::integer
    WHEN activity_type = 'posts_count' THEN (le.evidence_data->'tracking_metrics'->>'posts_count')::integer
    WHEN activity_type = 'profile_views' THEN (le.evidence_data->'tracking_metrics'->>'profile_views')::integer
  END as value,
  NOW() as created_at,
  NOW() as updated_at
FROM linkedin_evidence le
JOIN linkedin_user_tasks lut ON le.user_task_id = lut.id
CROSS JOIN (VALUES ('connections_accepted'), ('posts_count'), ('profile_views')) AS t(activity_type)  
WHERE lut.status = 'VERIFIED'
  AND le.evidence_data IS NOT NULL
  AND le.evidence_data->'tracking_metrics' IS NOT NULL
  AND lut.id = '0969dda2-75a5-4632-9404-aa9ad7b2dca1' -- The specific approved task
  AND CASE 
    WHEN activity_type = 'connections_accepted' THEN (le.evidence_data->'tracking_metrics'->>'connections_accepted')::integer > 0
    WHEN activity_type = 'posts_count' THEN (le.evidence_data->'tracking_metrics'->>'posts_count')::integer > 0  
    WHEN activity_type = 'profile_views' THEN (le.evidence_data->'tracking_metrics'->>'profile_views')::integer > 0
  END
ON CONFLICT (user_id, date, activity_id) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();