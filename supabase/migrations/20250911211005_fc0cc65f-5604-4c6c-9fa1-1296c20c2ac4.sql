-- Fix rejected LinkedIn tasks that still have points awarded
-- Set score_awarded to 0 for all rejected LinkedIn tasks
UPDATE linkedin_user_tasks 
SET score_awarded = 0,
    updated_at = NOW()
WHERE status = 'REJECTED' 
  AND score_awarded > 0;

-- Remove any points from user_activity_points for rejected LinkedIn tasks
DELETE FROM user_activity_points 
WHERE activity_id IN (
  SELECT CONCAT('linkedin_task_', task_id)
  FROM linkedin_user_tasks 
  WHERE status = 'REJECTED'
);

-- Also fix GitHub tasks if any exist with the same issue
UPDATE github_user_tasks 
SET score_awarded = 0,
    updated_at = NOW()
WHERE status = 'REJECTED' 
  AND score_awarded > 0;