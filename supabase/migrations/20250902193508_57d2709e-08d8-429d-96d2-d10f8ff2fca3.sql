-- Fix RLS policies for job_hunting_assignments and github_user_tasks
-- to ensure institute admins only see assignments from their institute users

-- Drop existing overly permissive policies on job_hunting_assignments
DROP POLICY IF EXISTS "Recruiters can manage job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Users can view their own job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can view all job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can manage job hunting assignments" ON public.job_hunting_assignments;

-- Create proper RLS policies for job_hunting_assignments
CREATE POLICY "Users can view their own job hunting assignments"
ON public.job_hunting_assignments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own job hunting assignments"
ON public.job_hunting_assignments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all job hunting assignments"
ON public.job_hunting_assignments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institute admins can manage their institute job hunting assignments"
ON public.job_hunting_assignments
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = job_hunting_assignments.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = job_hunting_assignments.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

CREATE POLICY "Recruiters can manage non-institute job hunting assignments"
ON public.job_hunting_assignments
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = job_hunting_assignments.user_id 
      AND ua.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = job_hunting_assignments.user_id 
      AND ua.is_active = true
  )
);

CREATE POLICY "Service role can manage job hunting assignments"
ON public.job_hunting_assignments
FOR ALL
TO authenticated
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Drop existing overly permissive policies on github_user_tasks
DROP POLICY IF EXISTS "Users can manage their own GitHub tasks" ON public.github_user_tasks;
DROP POLICY IF EXISTS "Recruiters and admins can view GitHub tasks for verification" ON public.github_user_tasks;
DROP POLICY IF EXISTS "Institute admins can view all GitHub tasks" ON public.github_user_tasks;
DROP POLICY IF EXISTS "Institute admins can manage GitHub tasks" ON public.github_user_tasks;

-- Create proper RLS policies for github_user_tasks
CREATE POLICY "Users can view their own GitHub tasks"
ON public.github_user_tasks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own GitHub tasks"
ON public.github_user_tasks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all GitHub tasks"
ON public.github_user_tasks
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institute admins can manage their institute GitHub tasks"
ON public.github_user_tasks
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_user_tasks.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_user_tasks.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

CREATE POLICY "Recruiters can manage non-institute GitHub tasks"
ON public.github_user_tasks
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = github_user_tasks.user_id 
      AND ua.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = github_user_tasks.user_id 
      AND ua.is_active = true
  )
);

CREATE POLICY "Service role can manage GitHub tasks"
ON public.github_user_tasks
FOR ALL
TO authenticated
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');