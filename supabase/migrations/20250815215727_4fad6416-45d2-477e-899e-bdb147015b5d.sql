-- Remove incorrect activity point record for unassigned user
-- This user has resume_completion_80 activity but wrong points (10 instead of 80)
-- and is not assigned to any institute
DELETE FROM user_activity_points 
WHERE user_id = '68609405-ed42-4f14-9b21-4cd6a5bc7885' 
  AND activity_id = 'resume_completion_80' 
  AND points_earned = 10;