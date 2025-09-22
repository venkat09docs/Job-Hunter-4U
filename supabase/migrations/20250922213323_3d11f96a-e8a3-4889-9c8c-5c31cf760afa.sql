-- SECURITY FIX: Clean up conflicting RLS policies on linkedin_user_tasks table
-- Remove all existing policies first
DROP POLICY IF EXISTS "Institute admins can manage institute linkedin tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can manage their institute LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can update student LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can view institute linkedin tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters can manage non-institute LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters can update non-institute LinkedIn user tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters can view non-institute LinkedIn user tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters manage non-institute LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters see non-institute LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users can manage their own LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users can view their own LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users own LinkedIn tasks" ON linkedin_user_tasks;

-- Create clean, non-conflicting policies
-- 1. Users can manage their own tasks
CREATE POLICY "Users can manage their own LinkedIn tasks"
ON linkedin_user_tasks FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Super admins can manage all LinkedIn tasks
CREATE POLICY "Super admins can manage all LinkedIn tasks"
ON linkedin_user_tasks FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Institute admins can ONLY manage LinkedIn tasks for users in THEIR institutes
CREATE POLICY "Institute admins can manage their institute LinkedIn tasks"
ON linkedin_user_tasks FOR ALL
TO authenticated
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

-- 4. Recruiters can manage LinkedIn tasks for users NOT assigned to any institute
CREATE POLICY "Recruiters can manage non-institute LinkedIn tasks"
ON linkedin_user_tasks FOR ALL
TO authenticated
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

-- 5. Service role can manage all (for edge functions)
CREATE POLICY "Service role can manage all LinkedIn tasks"
ON linkedin_user_tasks FOR ALL
TO service_role
USING (true)
WITH CHECK (true);