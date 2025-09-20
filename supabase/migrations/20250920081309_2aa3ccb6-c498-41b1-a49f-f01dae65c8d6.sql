-- Fix RLS policies for institute-based data isolation 
-- Focus only on confirmed existing tables

-- Drop and recreate LinkedIn User Tasks policies
DROP POLICY IF EXISTS "Institute admins can view institute linkedin tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can manage institute linkedin tasks" ON public.linkedin_user_tasks;

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

-- Drop and recreate Job Hunting Assignments policies  
DROP POLICY IF EXISTS "Institute admins can view institute job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can manage institute job hunting assignments" ON public.job_hunting_assignments;

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

-- Drop and recreate Daily Job Hunting Tasks policies
DROP POLICY IF EXISTS "Institute admins can view institute daily job hunting tasks" ON public.daily_job_hunting_tasks;
DROP POLICY IF EXISTS "Institute admins can manage institute daily job hunting tasks" ON public.daily_job_hunting_tasks;

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