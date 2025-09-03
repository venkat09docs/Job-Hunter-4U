-- Fix the RLS policy for updating daily job hunting tasks
-- The issue is that the policy was checking the NEW row's status instead of allowing transition from pending/rejected to submitted

DROP POLICY "Users can update their own daily tasks" ON public.daily_job_hunting_tasks;

-- Create a new policy that allows users to update their own tasks regardless of status
-- But add a WITH CHECK to ensure they can only transition to valid states
CREATE POLICY "Users can update their own daily tasks" 
ON public.daily_job_hunting_tasks 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'submitted', 'rejected'));