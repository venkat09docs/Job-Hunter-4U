-- Fix RLS policy for career_task_assignments to properly exclude users without institute assignments

-- Drop the existing policy that allows access to unassigned users
DROP POLICY IF EXISTS "Institute admins manage institute career assignments" ON career_task_assignments;

-- Create a stricter policy that ONLY allows access to users in the same institute
CREATE POLICY "Institute admins manage institute career assignments" 
ON career_task_assignments 
FOR ALL
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  -- User MUST be assigned to an institute AND it must match the admin's institute
  (EXISTS ( 
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON (ua.institute_id = iaa.institute_id)
    WHERE ua.user_id = career_task_assignments.user_id 
      AND iaa.user_id = auth.uid() 
      AND ua.is_active = true 
      AND iaa.is_active = true
  )) AND
  -- Explicitly exclude users who have no institute assignments
  (EXISTS (
    SELECT 1 
    FROM user_assignments ua 
    WHERE ua.user_id = career_task_assignments.user_id 
      AND ua.is_active = true
  ))
)
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  -- User MUST be assigned to an institute AND it must match the admin's institute  
  (EXISTS ( 
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON (ua.institute_id = iaa.institute_id)
    WHERE ua.user_id = career_task_assignments.user_id 
      AND iaa.user_id = auth.uid() 
      AND ua.is_active = true 
      AND iaa.is_active = true
  )) AND
  -- Explicitly exclude users who have no institute assignments
  (EXISTS (
    SELECT 1 
    FROM user_assignments ua 
    WHERE ua.user_id = career_task_assignments.user_id 
      AND ua.is_active = true
  ))
);

-- Apply the same fix to other assignment tables
DROP POLICY IF EXISTS "Institute admins can manage institute job hunting assignments" ON job_hunting_assignments;

CREATE POLICY "Institute admins can manage institute job hunting assignments"
ON job_hunting_assignments
FOR ALL
TO authenticated  
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON (ua.institute_id = iaa.institute_id)
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
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON (ua.institute_id = iaa.institute_id)
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

-- Fix github_user_tasks RLS as well
DROP POLICY IF EXISTS "Institute admins can manage institute GitHub tasks" ON github_user_tasks;

CREATE POLICY "Institute admins can manage institute GitHub tasks"
ON github_user_tasks
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON (ua.institute_id = iaa.institute_id)
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
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  (EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON (ua.institute_id = iaa.institute_id)
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