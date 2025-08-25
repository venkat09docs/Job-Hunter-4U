-- Add 'rejected' to the allowed status values for career_task_assignments
ALTER TABLE public.career_task_assignments 
DROP CONSTRAINT IF EXISTS career_task_assignments_status_check;

ALTER TABLE public.career_task_assignments 
ADD CONSTRAINT career_task_assignments_status_check 
CHECK (status = ANY (ARRAY['assigned'::text, 'started'::text, 'submitted'::text, 'partially_verified'::text, 'verified'::text, 'rejected'::text]));