-- Clean up all conflicting RLS policies for career_task_assignments and create a simple, clean set

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Institute admins can update their institute assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Institute admins can view their institute assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Institute admins can view and update their institute assignment" ON career_task_assignments;
DROP POLICY IF EXISTS "Recruiters can view and update non-institute user assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Recruiters can view non-institute user assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Recruiters can view non-institute user career assignments" ON career_task_assignments;
DROP POLICY IF EXISTS "Recruiters can update non-institute user assignments" ON career_task_assignments;

-- Create clean, simple policies

-- 1. Users can manage their own assignments
-- (Keep existing user policies - they're fine)

-- 2. Super admins can see everything  
-- (Keep existing admin policy - it's fine)

-- 3. Service role can insert
-- (Keep existing service policy - it's fine)

-- 4. Institute admins can ONLY see assignments from users in their institutes
CREATE POLICY "Institute admins can manage their institute user assignments" 
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

-- 5. Recruiters can ONLY see assignments from users who are NOT in any institute
CREATE POLICY "Recruiters can manage non-institute user assignments" 
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