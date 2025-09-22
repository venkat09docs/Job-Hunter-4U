-- FINAL FIX: Complete cleanup of conflicting RLS policies on linkedin_user_tasks table

-- Remove ALL existing policies on linkedin_user_tasks table
DROP POLICY IF EXISTS "Institute admins can manage their institute LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters can manage non-institute LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Service role can manage LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Service role can manage all LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Service role can manage all tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Service role manages LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Super admins can manage all LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Super admins can manage non-institute LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users can manage own LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users can manage their own LinkedIn tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users can manage their own LinkedIn user tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users can view own tasks" ON linkedin_user_tasks;
DROP POLICY IF EXISTS "Users manage own LinkedIn tasks" ON linkedin_user_tasks;

-- Create ONLY the essential, non-conflicting policies

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

-- 3. Institute admins can ONLY manage LinkedIn tasks for users in THEIR specific institutes
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