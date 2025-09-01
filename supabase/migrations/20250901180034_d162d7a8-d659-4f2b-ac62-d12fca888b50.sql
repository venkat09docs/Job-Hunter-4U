-- Fix security issues in assignment tables by ensuring proper authentication and role-based access

-- First, drop any problematic policies and recreate them with proper security
-- This will ensure no unauthorized access to assignment data

-- Drop existing policies on career_task_assignments
DROP POLICY IF EXISTS "Institute admins can manage their institute user assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Recruiters can manage non-institute user assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Service role can insert assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Super admins can update all assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Super admins can view all assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON career_task_assignments;

-- Drop existing policies on linkedin_user_tasks
DROP POLICY IF EXISTS "Admins can manage all LinkedIn user tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can manage their institute user LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters can manage non-institute user LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users can view and update their own LinkedIn tasks" ON linkedin_user_tasks;

-- Drop existing policies on job_hunting_assignments  
DROP POLICY IF EXISTS "Admins can manage all job hunting assignments" ON job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can manage their institute user job hunting as" ON job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can manage their institute user job hunting tasks" ON job_hunting_assignments;
DROP POLICY IF EXISTS "Recruiters can manage non-institute user job hunting tasks" ON job_hunting_assignments;
DROP POLICY IF EXISTS "Users can manage their own job hunting assignments" ON job_hunting_assignments;

-- Drop existing policies on github_user_tasks
DROP POLICY IF EXISTS "Admins can manage all GitHub user tasks" ON github_user_tasks;
DROP POLICY IF EXISTS "Institute admins can manage their institute user GitHub tasks" ON github_user_tasks;
DROP POLICY IF EXISTS "Institute admins can update their students GitHub tasks for ver" ON github_user_tasks;
DROP POLICY IF EXISTS "Institute admins can view their students GitHub tasks" ON github_user_tasks;
DROP POLICY IF EXISTS "Only admins can manually refresh assignments" ON github_user_tasks;
DROP POLICY IF EXISTS "Recruiters can manage non-institute user GitHub tasks" ON github_user_tasks;
DROP POLICY IF EXISTS "Users can manage their own GitHub tasks" ON github_user_tasks;

-- Create secure policies for career_task_assignments
CREATE POLICY "Users own career assignments"
ON career_task_assignments FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own career assignments"
ON career_task_assignments FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own career assignments"
ON career_task_assignments FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all career assignments"
ON career_task_assignments FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Institute admins manage institute career assignments"
ON career_task_assignments FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = career_task_assignments.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Recruiters manage non-institute career assignments"
ON career_task_assignments FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'recruiter'::app_role) AND
  NOT EXISTS (
    SELECT 1 FROM user_assignments ua
    WHERE ua.user_id = career_task_assignments.user_id 
    AND ua.is_active = true
  )
);

-- Create secure policies for linkedin_user_tasks
CREATE POLICY "Users manage own LinkedIn tasks"
ON linkedin_user_tasks FOR ALL
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage all LinkedIn tasks"
ON linkedin_user_tasks FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Institute admins manage institute LinkedIn tasks"
ON linkedin_user_tasks FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Recruiters manage non-institute LinkedIn tasks"
ON linkedin_user_tasks FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'recruiter'::app_role) AND
  NOT EXISTS (
    SELECT 1 FROM user_assignments ua
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  )
);

-- Create secure policies for job_hunting_assignments
CREATE POLICY "Users manage own job hunting assignments"
ON job_hunting_assignments FOR ALL
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage all job hunting assignments"
ON job_hunting_assignments FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Institute admins manage institute job hunting"
ON job_hunting_assignments FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Recruiters manage non-institute job hunting"
ON job_hunting_assignments FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'recruiter'::app_role) AND
  NOT EXISTS (
    SELECT 1 FROM user_assignments ua
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND ua.is_active = true
  )
);

-- Create secure policies for github_user_tasks
CREATE POLICY "Users manage own GitHub tasks"
ON github_user_tasks FOR ALL
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage all GitHub tasks"
ON github_user_tasks FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Institute admins manage institute GitHub tasks"
ON github_user_tasks FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'institute_admin'::app_role) AND
  EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

CREATE POLICY "Recruiters manage non-institute GitHub tasks"
ON github_user_tasks FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  has_role(auth.uid(), 'recruiter'::app_role) AND
  NOT EXISTS (
    SELECT 1 FROM user_assignments ua
    WHERE ua.user_id = github_user_tasks.user_id 
    AND ua.is_active = true
  )
);

-- Add service role access for automated systems
CREATE POLICY "Service role manages career assignments"
ON career_task_assignments FOR ALL
USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role manages LinkedIn tasks" 
ON linkedin_user_tasks FOR ALL
USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role manages job hunting assignments"
ON job_hunting_assignments FOR ALL  
USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role manages GitHub tasks"
ON github_user_tasks FOR ALL
USING (current_setting('role') = 'service_role');