-- Fix RLS policies for career_task_assignments to ensure recruiters only see non-institute users' assignments

-- Drop the overly permissive policies that allow recruiters to see all assignments
DROP POLICY IF EXISTS "Institute admins and recruiters can update assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Institute admins and recruiters can view assignments" ON career_task_assignments;

-- Keep the specific policies that correctly restrict access
-- Recruiters should only see assignments from users who are NOT in institutes
-- Institute admins should only see assignments from users in their institutes

-- Ensure we have the correct policies in place
CREATE POLICY "Recruiters can view and update non-institute user assignments" 
ON career_task_assignments 
FOR ALL 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) AND 
  NOT EXISTS (
    SELECT 1 
    FROM user_assignments ua 
    WHERE ua.user_id = career_task_assignments.user_id 
    AND ua.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role) AND 
  NOT EXISTS (
    SELECT 1 
    FROM user_assignments ua 
    WHERE ua.user_id = career_task_assignments.user_id 
    AND ua.is_active = true
  )
);

-- Institute admins can only see assignments from users in their institutes
CREATE POLICY "Institute admins can view and update their institute assignments" 
ON career_task_assignments 
FOR ALL
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  EXISTS (
    SELECT 1 
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = career_task_assignments.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'institute_admin'::app_role) AND 
  EXISTS (
    SELECT 1 
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = career_task_assignments.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);