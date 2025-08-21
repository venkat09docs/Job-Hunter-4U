-- Drop the existing check constraint
ALTER TABLE career_task_assignments DROP CONSTRAINT IF EXISTS career_task_assignments_status_check;

-- Add the updated check constraint that includes 'started' status
ALTER TABLE career_task_assignments ADD CONSTRAINT career_task_assignments_status_check 
CHECK (status IN ('assigned', 'started', 'submitted', 'partially_verified', 'verified'));