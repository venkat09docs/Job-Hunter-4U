-- Add unique constraints to career_task_assignments table to support upsert operations

-- First, let's check if there are any duplicate records that would prevent adding constraints
-- For weekly tasks (with period), ensure unique combination of user_id, template_id, and period
CREATE UNIQUE INDEX IF NOT EXISTS idx_career_task_assignments_weekly 
ON career_task_assignments (user_id, template_id, period) 
WHERE period IS NOT NULL;

-- For one-off tasks (without period), ensure unique combination of user_id and template_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_career_task_assignments_oneoff 
ON career_task_assignments (user_id, template_id) 
WHERE period IS NULL;