-- Fix RLS policies for career_task_assignments to properly separate institute admin and recruiter access
-- Drop ALL existing policies first to ensure clean state

DROP POLICY IF EXISTS "Institute admins can view their institute assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Institute admins can update their institute assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Recruiters can view non-institute user assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Recruiters can update non-institute user assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Super admins can view all assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Super admins can update all assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Users can view their own assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Service role can insert assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON career_task_assignments;

-- Create new, properly separated policies

-- 1. Super admins can view and manage all assignments
CREATE POLICY "Super admins can view all assignments" ON career_task_assignments
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Super admins can update all assignments" ON career_task_assignments
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Institute admins can ONLY view/update assignments from THEIR institute users
CREATE POLICY "Institute admins can view their institute assignments" ON career_task_assignments
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = career_task_assignments.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

CREATE POLICY "Institute admins can update their institute assignments" ON career_task_assignments
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = career_task_assignments.user_id
      AND iaa.user_id = auth.uid()
      AND ua.is_active = true
      AND iaa.is_active = true
  )
);

-- 3. Recruiters can ONLY view/update assignments from NON-institute users
CREATE POLICY "Recruiters can view non-institute user assignments" ON career_task_assignments
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM user_assignments ua 
    WHERE ua.user_id = career_task_assignments.user_id 
      AND ua.is_active = true
  )
);

CREATE POLICY "Recruiters can update non-institute user assignments" ON career_task_assignments
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM user_assignments ua 
    WHERE ua.user_id = career_task_assignments.user_id 
      AND ua.is_active = true
  )
);

-- 4. Users can view and update their own assignments
CREATE POLICY "Users can view their own assignments" ON career_task_assignments
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" ON career_task_assignments
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- 5. Keep existing insert policies for functionality
CREATE POLICY "Users can insert their own assignments" ON career_task_assignments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert assignments" ON career_task_assignments
FOR INSERT TO authenticated
WITH CHECK (true);