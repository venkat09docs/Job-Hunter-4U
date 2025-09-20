-- Fix RLS policies to ensure strict institute-based filtering for all assignment tables

-- First, let's create a helper function to check if a user belongs to the current admin's institute
CREATE OR REPLACE FUNCTION public.is_user_in_admin_institute(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = target_user_id
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true
    AND iaa.is_active = true
  );
$$;

-- Update LinkedIn user tasks policies to be more restrictive
DROP POLICY IF EXISTS "Institute admins can view institute linkedin tasks" ON linkedin_user_tasks;
CREATE POLICY "Institute admins can view institute linkedin tasks"
ON linkedin_user_tasks FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
    OR (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND is_user_in_admin_institute(user_id)
    )
    OR (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = linkedin_user_tasks.user_id AND ua.is_active = true
      )
    )
  )
);

-- Update job hunting assignments policies
DROP POLICY IF EXISTS "Institute admins can view institute job hunting assignments" ON job_hunting_assignments;
CREATE POLICY "Institute admins can view institute job hunting assignments"
ON job_hunting_assignments FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
    OR (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND is_user_in_admin_institute(user_id)
    )
    OR (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = job_hunting_assignments.user_id AND ua.is_active = true
      )
    )
  )
);

-- Update daily job hunting tasks policies
DROP POLICY IF EXISTS "Institute admins can view institute daily job hunting tasks" ON daily_job_hunting_tasks;
CREATE POLICY "Institute admins can view institute daily job hunting tasks"
ON daily_job_hunting_tasks FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
    OR (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND is_user_in_admin_institute(user_id)
    )
    OR (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = daily_job_hunting_tasks.user_id AND ua.is_active = true
      )
    )
  )
);

-- Update GitHub user tasks policies  
DROP POLICY IF EXISTS "Institute admins can view institute GitHub tasks" ON github_user_tasks;
CREATE POLICY "Institute admins can view institute GitHub tasks"
ON github_user_tasks FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
    OR (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND is_user_in_admin_institute(user_id)
    )
    OR (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = github_user_tasks.user_id AND ua.is_active = true
      )
    )
  )
);