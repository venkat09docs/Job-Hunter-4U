-- Fix RLS policies for LinkedIn, GitHub, and Job Hunting assignments to match career assignments
-- These need to be updated to ensure institute admins only see users from their assigned institutes

-- Fix LinkedIn user tasks policies
DROP POLICY IF EXISTS "Recruiters can view non-institute user LinkedIn progress" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can view student LinkedIn progress" ON linkedin_user_tasks;

CREATE POLICY "Institute admins can manage their institute user LinkedIn tasks" 
ON linkedin_user_tasks 
FOR ALL 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = linkedin_user_tasks.user_id 
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
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Recruiters can manage non-institute user LinkedIn tasks" 
ON linkedin_user_tasks 
FOR ALL 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  )
);

-- Fix GitHub user tasks policies
DROP POLICY IF EXISTS "Recruiters can view non-institute user GitHub progress" ON github_user_tasks;
DROP POLICY IF EXISTS "Institute admins can view student GitHub progress" ON github_user_tasks;

CREATE POLICY "Institute admins can manage their institute user GitHub tasks" 
ON github_user_tasks 
FOR ALL 
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

CREATE POLICY "Recruiters can manage non-institute user GitHub tasks" 
ON github_user_tasks 
FOR ALL 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = github_user_tasks.user_id 
    AND ua.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = github_user_tasks.user_id 
    AND ua.is_active = true
  )
);

-- Fix Job Hunting assignments policies
DROP POLICY IF EXISTS "Recruiters can view non-institute user job hunting assignments" ON job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can view student job hunting assignments" ON job_hunting_assignments;

CREATE POLICY "Institute admins can manage their institute user job hunting assignments" 
ON job_hunting_assignments 
FOR ALL 
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

CREATE POLICY "Recruiters can manage non-institute user job hunting assignments" 
ON job_hunting_assignments 
FOR ALL 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND ua.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND ua.is_active = true
  )
);