-- Fix RLS policies to properly separate access between institute admins and recruiters
-- The current policies incorrectly allow recruiters to see institute user assignments

-- Drop the existing problematic policies for career_task_assignments
DROP POLICY IF EXISTS "Institute admins and recruiters can view assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Institute admins and recruiters can update assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Recruiters can view non-institute user career assignments" ON career_task_assignments;

-- Create new, more precise policies

-- 1. Super admins can view all assignments
CREATE POLICY "Super admins can view all assignments" ON career_task_assignments
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Institute admins can only view assignments from their institute users
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

-- 3. Recruiters can only view assignments from NON-institute users
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

-- 4. Users can view their own assignments
CREATE POLICY "Users can view their own assignments" ON career_task_assignments
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Update policies for assignments
-- 1. Super admins can update all assignments
CREATE POLICY "Super admins can update all assignments" ON career_task_assignments
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Institute admins can update assignments from their institute users
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

-- 3. Recruiters can update assignments from NON-institute users only
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

-- 4. Users can update their own assignments
CREATE POLICY "Users can update their own assignments" ON career_task_assignments
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);