-- Fix RLS policies for LinkedIn tables to prevent recruiters from seeing institute user assignments

-- First, check and fix linkedin_user_tasks table
DROP POLICY IF EXISTS "Admins can manage all LinkedIn user tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Users can view their own LinkedIn user tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Recruiters can view LinkedIn user tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can view LinkedIn user tasks" ON public.linkedin_user_tasks;

-- Create proper RLS policies for linkedin_user_tasks
CREATE POLICY "Admins can manage all LinkedIn tasks" 
ON public.linkedin_user_tasks 
FOR ALL 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own LinkedIn tasks" 
ON public.linkedin_user_tasks 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recruiters see non-institute LinkedIn tasks" 
ON public.linkedin_user_tasks 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua 
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND ua.is_active = true
  )
);

CREATE POLICY "Institute admins see institute LinkedIn tasks" 
ON public.linkedin_user_tasks 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM user_assignments ua 
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id 
    WHERE ua.user_id = linkedin_user_tasks.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- Fix linkedin_evidence table RLS policies
DROP POLICY IF EXISTS "Users can manage their own LinkedIn evidence" ON public.linkedin_evidence;
DROP POLICY IF EXISTS "Recruiters and admins can view LinkedIn evidence for verification" ON public.linkedin_evidence;

CREATE POLICY "Admins can manage all LinkedIn evidence" 
ON public.linkedin_evidence 
FOR ALL 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own LinkedIn evidence" 
ON public.linkedin_evidence 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM linkedin_user_tasks lut 
    WHERE lut.id = linkedin_evidence.user_task_id 
    AND lut.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM linkedin_user_tasks lut 
    WHERE lut.id = linkedin_evidence.user_task_id 
    AND lut.user_id = auth.uid()
  )
);

CREATE POLICY "Recruiters see non-institute LinkedIn evidence" 
ON public.linkedin_evidence 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'recruiter'::app_role) 
  AND EXISTS (
    SELECT 1 FROM linkedin_user_tasks lut 
    WHERE lut.id = linkedin_evidence.user_task_id 
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = lut.user_id 
      AND ua.is_active = true
    )
  )
);

CREATE POLICY "Institute admins see institute LinkedIn evidence" 
ON public.linkedin_evidence 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1 FROM linkedin_user_tasks lut 
    JOIN user_assignments ua ON lut.user_id = ua.user_id 
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id 
    WHERE lut.id = linkedin_evidence.user_task_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);