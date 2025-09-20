-- Fix RLS policies for institute-based data isolation
-- Ensure institute admins can only see data from their own institute users

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Institute admins can view institute linkedin tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can manage institute linkedin tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can view institute job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can manage institute job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can view institute daily job hunting tasks" ON public.daily_job_hunting_tasks;
DROP POLICY IF EXISTS "Institute admins can manage institute daily job hunting tasks" ON public.daily_job_hunting_tasks;

-- LinkedIn User Tasks - Institute Admin Access
CREATE POLICY "Institute admins can view institute linkedin tasks" 
ON public.linkedin_user_tasks 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Super admins can see all
    has_role(auth.uid(), 'admin'::app_role) 
    OR 
    -- Users can see their own
    (auth.uid() = user_id)
    OR
    -- Institute admins can see tasks from users in their institute
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
    -- Recruiters can see tasks from non-institute users
    (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = linkedin_user_tasks.user_id 
        AND ua.is_active = true
      )
    )
  )
);

CREATE POLICY "Institute admins can manage institute linkedin tasks" 
ON public.linkedin_user_tasks 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Super admins can manage all
    has_role(auth.uid(), 'admin'::app_role) 
    OR 
    -- Users can manage their own
    (auth.uid() = user_id)
    OR
    -- Institute admins can manage tasks from users in their institute
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
    -- Recruiters can manage tasks from non-institute users
    (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = linkedin_user_tasks.user_id 
        AND ua.is_active = true
      )
    )
    OR 
    -- Service role can manage all
    (current_setting('role') = 'service_role')
  )
);

-- Job Hunting Assignments - Institute Admin Access
CREATE POLICY "Institute admins can view institute job hunting assignments" 
ON public.job_hunting_assignments 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Super admins can see all
    has_role(auth.uid(), 'admin'::app_role) 
    OR 
    -- Users can see their own
    (auth.uid() = user_id)
    OR
    -- Institute admins can see assignments from users in their institute
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
    -- Recruiters can see assignments from non-institute users
    (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = job_hunting_assignments.user_id 
        AND ua.is_active = true
      )
    )
  )
);

CREATE POLICY "Institute admins can manage institute job hunting assignments" 
ON public.job_hunting_assignments 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Super admins can manage all
    has_role(auth.uid(), 'admin'::app_role) 
    OR 
    -- Users can manage their own
    (auth.uid() = user_id)
    OR
    -- Institute admins can manage assignments from users in their institute
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
    -- Recruiters can manage assignments from non-institute users
    (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = job_hunting_assignments.user_id 
        AND ua.is_active = true
      )
    )
    OR 
    -- Service role can manage all
    (current_setting('role') = 'service_role')
  )
);

-- Daily Job Hunting Tasks - Institute Admin Access
CREATE POLICY "Institute admins can view institute daily job hunting tasks" 
ON public.daily_job_hunting_tasks 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Super admins can see all
    has_role(auth.uid(), 'admin'::app_role) 
    OR 
    -- Users can see their own
    (auth.uid() = user_id)
    OR
    -- Institute admins can see tasks from users in their institute
    (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM user_assignments ua
        JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
        WHERE ua.user_id = daily_job_hunting_tasks.user_id 
        AND iaa.user_id = auth.uid()
        AND ua.is_active = true 
        AND iaa.is_active = true
      )
    )
    OR
    -- Recruiters can see tasks from non-institute users
    (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = daily_job_hunting_tasks.user_id 
        AND ua.is_active = true
      )
    )
  )
);

CREATE POLICY "Institute admins can manage institute daily job hunting tasks" 
ON public.daily_job_hunting_tasks 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND (
    -- Super admins can manage all
    has_role(auth.uid(), 'admin'::app_role) 
    OR 
    -- Users can manage their own
    (auth.uid() = user_id)
    OR
    -- Institute admins can manage tasks from users in their institute
    (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM user_assignments ua
        JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
        WHERE ua.user_id = daily_job_hunting_tasks.user_id 
        AND iaa.user_id = auth.uid()
        AND ua.is_active = true 
        AND iaa.is_active = true
      )
    )
    OR
    -- Recruiters can manage tasks from non-institute users
    (
      has_role(auth.uid(), 'recruiter'::app_role) 
      AND NOT EXISTS (
        SELECT 1 FROM user_assignments ua 
        WHERE ua.user_id = daily_job_hunting_tasks.user_id 
        AND ua.is_active = true
      )
    )
    OR 
    -- Service role can manage all
    (current_setting('role') = 'service_role')
  )
);

-- Fix GitHub related tables - Check if github_weekly table exists and add policy
DO $$ 
BEGIN
  -- Check if github_weekly table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'github_weekly') THEN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Institute admins can view institute github weekly" ON public.github_weekly;
    DROP POLICY IF EXISTS "Institute admins can manage institute github weekly" ON public.github_weekly;
    
    -- Create new institute-based policies for github_weekly
    EXECUTE 'CREATE POLICY "Institute admins can view institute github weekly" 
    ON public.github_weekly 
    FOR SELECT 
    USING (
      auth.uid() IS NOT NULL 
      AND (
        has_role(auth.uid(), ''admin''::app_role) 
        OR 
        (auth.uid() = user_id)
        OR
        (
          has_role(auth.uid(), ''institute_admin''::app_role) 
          AND EXISTS (
            SELECT 1
            FROM user_assignments ua
            JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
            WHERE ua.user_id = github_weekly.user_id 
            AND iaa.user_id = auth.uid()
            AND ua.is_active = true 
            AND iaa.is_active = true
          )
        )
        OR
        (
          has_role(auth.uid(), ''recruiter''::app_role) 
          AND NOT EXISTS (
            SELECT 1 FROM user_assignments ua 
            WHERE ua.user_id = github_weekly.user_id 
            AND ua.is_active = true
          )
        )
      )
    )';
    
    EXECUTE 'CREATE POLICY "Institute admins can manage institute github weekly" 
    ON public.github_weekly 
    FOR ALL 
    USING (
      auth.uid() IS NOT NULL 
      AND (
        has_role(auth.uid(), ''admin''::app_role) 
        OR 
        (auth.uid() = user_id)
        OR
        (
          has_role(auth.uid(), ''institute_admin''::app_role) 
          AND EXISTS (
            SELECT 1
            FROM user_assignments ua
            JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
            WHERE ua.user_id = github_weekly.user_id 
            AND iaa.user_id = auth.uid()
            AND ua.is_active = true 
            AND iaa.is_active = true
          )
        )
        OR
        (
          has_role(auth.uid(), ''recruiter''::app_role) 
          AND NOT EXISTS (
            SELECT 1 FROM user_assignments ua 
            WHERE ua.user_id = github_weekly.user_id 
            AND ua.is_active = true
          )
        )
        OR 
        (current_setting(''role'') = ''service_role'')
      )
    )';
  END IF;
END $$;

-- Add additional RLS policies for evidence tables if they exist
DO $$
BEGIN
  -- LinkedIn evidence table
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'linkedin_evidence') THEN
    DROP POLICY IF EXISTS "Institute admins can view institute linkedin evidence" ON public.linkedin_evidence;
    EXECUTE 'CREATE POLICY "Institute admins can view institute linkedin evidence" 
    ON public.linkedin_evidence 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM linkedin_user_tasks lut
        WHERE lut.id = linkedin_evidence.task_id 
        AND (
          auth.uid() = lut.user_id
          OR has_role(auth.uid(), ''admin''::app_role)
          OR (
            has_role(auth.uid(), ''institute_admin''::app_role) 
            AND EXISTS (
              SELECT 1
              FROM user_assignments ua
              JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
              WHERE ua.user_id = lut.user_id 
              AND iaa.user_id = auth.uid()
              AND ua.is_active = true 
              AND iaa.is_active = true
            )
          )
        )
      )
    )';
  END IF;
  
  -- Job hunting evidence table  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_hunting_evidence') THEN
    DROP POLICY IF EXISTS "Institute admins can view institute job hunting evidence" ON public.job_hunting_evidence;
    EXECUTE 'CREATE POLICY "Institute admins can view institute job hunting evidence" 
    ON public.job_hunting_evidence 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM job_hunting_assignments jha
        WHERE jha.id = job_hunting_evidence.assignment_id 
        AND (
          auth.uid() = jha.user_id
          OR has_role(auth.uid(), ''admin''::app_role)
          OR (
            has_role(auth.uid(), ''institute_admin''::app_role) 
            AND EXISTS (
              SELECT 1
              FROM user_assignments ua
              JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
              WHERE ua.user_id = jha.user_id 
              AND iaa.user_id = auth.uid()
              AND ua.is_active = true 
              AND iaa.is_active = true
            )
          )
        )
      )
    )';
  END IF;
END $$;