-- Fix RLS policies for institute admins to work correctly
-- Drop existing complex policies and create simpler ones

-- Career Task Assignments
DROP POLICY IF EXISTS "Institute admins can manage their institute user assignments" ON career_task_assignments;
CREATE POLICY "Institute admins can view their institute assignments" ON career_task_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = career_task_assignments.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Institute admins can update their institute assignments" ON career_task_assignments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = career_task_assignments.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- Job Hunting Assignments  
DROP POLICY IF EXISTS "Institute admins can update student job hunting assignments" ON job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can view student job hunting assignments" ON job_hunting_assignments;

CREATE POLICY "Institute admins can view their institute job hunting assignments" ON job_hunting_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Institute admins can update their institute job hunting assignments" ON job_hunting_assignments
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- LinkedIn User Tasks - Fix the complex policies
DROP POLICY IF EXISTS "Institute admins can manage their students LinkedIn tasks" ON linkedin_user_tasks;
CREATE POLICY "Institute admins can view their institute linkedin tasks" ON linkedin_user_tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM linkedin_users lu
    JOIN user_assignments ua ON lu.auth_uid = ua.user_id
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE lu.id = linkedin_user_tasks.linkedin_user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Institute admins can update their institute linkedin tasks" ON linkedin_user_tasks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM linkedin_users lu
    JOIN user_assignments ua ON lu.auth_uid = ua.user_id
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE lu.id = linkedin_user_tasks.linkedin_user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- GitHub User Tasks - Simplify policies
DROP POLICY IF EXISTS "Only admins can manually refresh assignments" ON github_user_tasks;
CREATE POLICY "Institute admins can view their institute github tasks" ON github_user_tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_user_tasks.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Institute admins can update their institute github tasks" ON github_user_tasks
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_user_tasks.user_id 
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);