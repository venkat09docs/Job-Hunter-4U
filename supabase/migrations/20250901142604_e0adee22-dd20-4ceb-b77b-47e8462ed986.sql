-- Fix RLS policies for recruiters to only see non-institute user assignments

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Recruiters can view all GitHub user tasks for verification" ON public.github_user_tasks;
DROP POLICY IF EXISTS "Recruiters can update GitHub user tasks for verification" ON public.github_user_tasks;
DROP POLICY IF EXISTS "Recruiters can view submitted job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Recruiters can update job hunting assignments for verification" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Recruiters can view all LinkedIn user tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters can update LinkedIn user tasks" ON public.linkedin_user_tasks;

-- Create new restricted policies for GitHub tasks
CREATE POLICY "Recruiters can view non-institute GitHub user tasks for verification" 
ON public.github_user_tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND (NOT (EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = github_user_tasks.user_id 
    AND ua.is_active = true
  )))
);

CREATE POLICY "Recruiters can update non-institute GitHub user tasks for verification" 
ON public.github_user_tasks 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND (NOT (EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = github_user_tasks.user_id 
    AND ua.is_active = true
  )))
);

-- Create new restricted policies for job hunting assignments
CREATE POLICY "Recruiters can view non-institute job hunting assignments" 
ON public.job_hunting_assignments 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND status = ANY (ARRAY['submitted'::text, 'verified'::text, 'rejected'::text])
  AND (NOT (EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND ua.is_active = true
  )))
);

CREATE POLICY "Recruiters can update non-institute job hunting assignments for verification" 
ON public.job_hunting_assignments 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND status = ANY (ARRAY['submitted'::text, 'verified'::text, 'rejected'::text])
  AND (NOT (EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = job_hunting_assignments.user_id 
    AND ua.is_active = true
  )))
);

-- Create new restricted policies for LinkedIn tasks
CREATE POLICY "Recruiters can view non-institute LinkedIn user tasks" 
ON public.linkedin_user_tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND (NOT (EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  )))
);

CREATE POLICY "Recruiters can update non-institute LinkedIn user tasks" 
ON public.linkedin_user_tasks 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND (NOT (EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  )))
);