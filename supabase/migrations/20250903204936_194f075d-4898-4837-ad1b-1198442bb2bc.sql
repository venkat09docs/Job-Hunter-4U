-- Add SELECT policies for institute admins and recruiters to view daily job hunting tasks

-- Institute admins can view daily tasks from their institute users
CREATE POLICY "Institute admins can view institute daily tasks" 
ON public.daily_job_hunting_tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = daily_job_hunting_tasks.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

-- Recruiters can view daily tasks from non-institute users
CREATE POLICY "Recruiters can view non-institute daily tasks" 
ON public.daily_job_hunting_tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = daily_job_hunting_tasks.user_id
      AND ua.is_active = true
  )
);