-- Fix LinkedIn Growth assignments segregation issue
-- Remove overly broad admin policies that bypass role-based filtering

-- Drop the problematic broad admin policies for LinkedIn evidence
DROP POLICY IF EXISTS "Admins can manage all LinkedIn evidence" ON public.linkedin_evidence;
DROP POLICY IF EXISTS "Admins can manage all evidence" ON public.linkedin_evidence;

-- Drop the problematic broad admin policies for LinkedIn user tasks  
DROP POLICY IF EXISTS "Admins can manage all LinkedIn tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Admins manage all LinkedIn tasks" ON public.linkedin_user_tasks;

-- Create proper admin policies that respect role-based segregation
-- Super admins can still manage, but through role-based policies

-- Add policy for super admins to manage LinkedIn evidence of non-institute users (like recruiters)
CREATE POLICY "Super admins can manage non-institute LinkedIn evidence" 
ON public.linkedin_evidence 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM linkedin_user_tasks lut
    WHERE lut.id = linkedin_evidence.user_task_id
    AND NOT EXISTS (
      SELECT 1
      FROM user_assignments ua
      WHERE ua.user_id = lut.user_id 
      AND ua.is_active = true
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM linkedin_user_tasks lut
    WHERE lut.id = linkedin_evidence.user_task_id
    AND NOT EXISTS (
      SELECT 1
      FROM user_assignments ua
      WHERE ua.user_id = lut.user_id 
      AND ua.is_active = true
    )
  )
);

-- Add policy for super admins to manage LinkedIn user tasks of non-institute users
CREATE POLICY "Super admins can manage non-institute LinkedIn tasks" 
ON public.linkedin_user_tasks 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role) 
  AND NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role) 
  AND NOT EXISTS (
    SELECT 1
    FROM user_assignments ua
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  )
);