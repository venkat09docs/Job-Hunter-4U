-- Fix LinkedIn user tasks RLS policies for proper institute admin filtering
-- The user_id field in linkedin_user_tasks directly references auth.users, not linkedin_users table

-- Drop the problematic policies that reference linkedin_users incorrectly
DROP POLICY IF EXISTS "Institute admins can update student LinkedIn tasks" ON public.linkedin_user_tasks;

-- Create proper RLS policies for LinkedIn user tasks that work with direct user_id references
CREATE POLICY "Institute admins can manage institute LinkedIn user tasks"
ON public.linkedin_user_tasks
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (
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
  OR
  (
    has_role(auth.uid(), 'recruiter'::app_role) 
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = linkedin_user_tasks.user_id 
        AND ua.is_active = true
    )
  )
  OR
  (auth.uid() = linkedin_user_tasks.user_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (
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
  OR
  (
    has_role(auth.uid(), 'recruiter'::app_role) 
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = linkedin_user_tasks.user_id 
        AND ua.is_active = true
    )
  )
  OR
  (auth.uid() = linkedin_user_tasks.user_id)
);

-- Also ensure similar policies exist for job_hunting_assignments to be consistent
CREATE POLICY "Institute admins can manage institute job hunting assignments"
ON public.job_hunting_assignments
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (
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
  OR
  (
    has_role(auth.uid(), 'recruiter'::app_role) 
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = job_hunting_assignments.user_id 
        AND ua.is_active = true
    )
  )
  OR
  (auth.uid() = job_hunting_assignments.user_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  (
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
  OR
  (
    has_role(auth.uid(), 'recruiter'::app_role) 
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = job_hunting_assignments.user_id 
        AND ua.is_active = true
    )
  )
  OR
  (auth.uid() = job_hunting_assignments.user_id)
);