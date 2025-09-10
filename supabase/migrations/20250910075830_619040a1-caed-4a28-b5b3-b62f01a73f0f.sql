-- Fix extension request RLS policies to match role requirements
-- Only fixing extension requests, leaving task assignments unchanged

-- 1. Fix LinkedIn Extension Requests - Add non-institute filtering for Recruiters
DROP POLICY IF EXISTS "Recruiters can update extension requests" ON public.linkedin_task_renable_requests;
DROP POLICY IF EXISTS "Recruiters can view all extension requests" ON public.linkedin_task_renable_requests;

CREATE POLICY "Recruiters can update non-institute extension requests" ON public.linkedin_task_renable_requests
FOR UPDATE TO public
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = linkedin_task_renable_requests.user_id 
    AND ua.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = linkedin_task_renable_requests.user_id 
    AND ua.is_active = true
  )
);

CREATE POLICY "Recruiters can view non-institute extension requests" ON public.linkedin_task_renable_requests
FOR SELECT TO public
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = linkedin_task_renable_requests.user_id 
    AND ua.is_active = true
  )
);

-- 2. Fix GitHub Extension Requests - Add proper role-based filtering
DROP POLICY IF EXISTS "Admins and recruiters can update GitHub extension requests" ON public.github_task_reenable_requests;
DROP POLICY IF EXISTS "Admins and recruiters can view all GitHub extension requests" ON public.github_task_reenable_requests;

-- Super Admins can manage ALL GitHub extension requests
CREATE POLICY "Super admins can manage all GitHub extension requests" ON public.github_task_reenable_requests
FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Recruiters can only manage non-institute GitHub extension requests
CREATE POLICY "Recruiters can manage non-institute GitHub extension requests" ON public.github_task_reenable_requests
FOR ALL TO public
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = github_task_reenable_requests.user_id 
    AND ua.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = github_task_reenable_requests.user_id 
    AND ua.is_active = true
  )
);

-- Institute Admins can only manage their institute's GitHub extension requests
CREATE POLICY "Institute admins can manage institute GitHub extension requests" ON public.github_task_reenable_requests
FOR ALL TO public
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_task_reenable_requests.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = github_task_reenable_requests.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- 3. Fix Job Hunting Extension Requests - Add non-institute filtering for Recruiters
DROP POLICY IF EXISTS "Admins can manage all extension requests" ON public.job_hunting_extension_requests;

-- Super Admins can manage ALL job hunting extension requests
CREATE POLICY "Super admins can manage all job hunting extension requests" ON public.job_hunting_extension_requests
FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Recruiters can only manage non-institute job hunting extension requests
CREATE POLICY "Recruiters can manage non-institute job hunting extension requests" ON public.job_hunting_extension_requests
FOR ALL TO public
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = job_hunting_extension_requests.user_id 
    AND ua.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = job_hunting_extension_requests.user_id 
    AND ua.is_active = true
  )
);