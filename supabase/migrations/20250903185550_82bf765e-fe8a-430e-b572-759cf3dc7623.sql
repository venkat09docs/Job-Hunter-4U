-- Fix existing LinkedIn metrics by properly aggregating from all verified tasks
-- Clear existing metrics for this user to recalculate correctly
DELETE FROM linkedin_network_metrics 
WHERE user_id = 'ec2027a6-4486-4feb-bc7b-bd0c6631ca57' 
  AND date = '2025-09-03';

-- Re-insert all metrics by aggregating from all verified LinkedIn tasks for today
INSERT INTO linkedin_network_metrics (user_id, date, activity_id, value, created_at, updated_at)
SELECT 
  lut.user_id,
  CURRENT_DATE as date,
  CASE 
    WHEN activity_type = 'connections_accepted' THEN 'connections_accepted'
    WHEN activity_type = 'posts_count' THEN 'create_post'  
    WHEN activity_type = 'profile_views' THEN 'profile_views'
  END as activity_id,
  SUM(CASE 
    WHEN activity_type = 'connections_accepted' THEN (le.evidence_data->'tracking_metrics'->>'connections_accepted')::integer
    WHEN activity_type = 'posts_count' THEN (le.evidence_data->'tracking_metrics'->>'posts_count')::integer
    WHEN activity_type = 'profile_views' THEN (le.evidence_data->'tracking_metrics'->>'profile_views')::integer
  END) as total_value,
  NOW() as created_at,
  NOW() as updated_at
FROM linkedin_evidence le
JOIN linkedin_user_tasks lut ON le.user_task_id = lut.id
CROSS JOIN (VALUES ('connections_accepted'), ('posts_count'), ('profile_views')) AS t(activity_type)  
WHERE lut.status = 'VERIFIED'
  AND le.evidence_data IS NOT NULL
  AND le.evidence_data->'tracking_metrics' IS NOT NULL
  AND lut.user_id = 'ec2027a6-4486-4feb-bc7b-bd0c6631ca57'
  AND DATE(lut.updated_at) = CURRENT_DATE  -- Only today's verified tasks
  AND CASE 
    WHEN activity_type = 'connections_accepted' THEN (le.evidence_data->'tracking_metrics'->>'connections_accepted')::integer > 0
    WHEN activity_type = 'posts_count' THEN (le.evidence_data->'tracking_metrics'->>'posts_count')::integer > 0  
    WHEN activity_type = 'profile_views' THEN (le.evidence_data->'tracking_metrics'->>'profile_views')::integer > 0
  END
GROUP BY lut.user_id, activity_id;