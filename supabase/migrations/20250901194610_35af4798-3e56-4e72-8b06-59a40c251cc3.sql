-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Institute admins manage institute LinkedIn tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins manage institute job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins manage institute GitHub tasks" ON public.github_user_tasks;
DROP POLICY IF EXISTS "Recruiters manage non-institute LinkedIn tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters manage non-institute job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Recruiters manage non-institute GitHub tasks" ON public.github_user_tasks;

-- Add RLS policies for LinkedIn user tasks to filter by institute admin assignments
CREATE POLICY "Institute admins manage institute LinkedIn tasks" 
ON public.linkedin_user_tasks 
FOR ALL 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  ))
)
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  ))
);

-- Add RLS policies for Job Hunting assignments to filter by institute admin assignments
CREATE POLICY "Institute admins manage institute job hunting assignments" 
ON public.job_hunting_assignments 
FOR ALL 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND ua.is_active = true
  ))
)
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND ua.is_active = true
  ))
);

-- Add RLS policies for GitHub user tasks to filter by institute admin assignments
CREATE POLICY "Institute admins manage institute GitHub tasks" 
ON public.github_user_tasks 
FOR ALL 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = github_user_tasks.user_id 
    AND ua.is_active = true
  ))
)
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )) AND 
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = github_user_tasks.user_id 
    AND ua.is_active = true
  ))
);

-- Ensure recruiters can still manage non-institute assignments
CREATE POLICY "Recruiters manage non-institute LinkedIn tasks" 
ON public.linkedin_user_tasks 
FOR ALL 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'recruiter'::app_role) AND 
  (NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  ))
);

CREATE POLICY "Recruiters manage non-institute job hunting assignments" 
ON public.job_hunting_assignments 
FOR ALL 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'recruiter'::app_role) AND 
  (NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND ua.is_active = true
  ))
);

CREATE POLICY "Recruiters manage non-institute GitHub tasks" 
ON public.github_user_tasks 
FOR ALL 
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'recruiter'::app_role) AND 
  (NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = github_user_tasks.user_id 
    AND ua.is_active = true
  ))
);