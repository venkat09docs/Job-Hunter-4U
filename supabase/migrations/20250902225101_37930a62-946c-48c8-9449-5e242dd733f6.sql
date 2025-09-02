-- Add service role policy for job_hunting_assignments table
-- This allows the verify-institute-assignments edge function to update job hunting assignments

CREATE POLICY "Service role manages job hunting assignments" ON job_hunting_assignments
FOR ALL USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');