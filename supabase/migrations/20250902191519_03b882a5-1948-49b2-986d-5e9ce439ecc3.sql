-- First, clean up existing conflicting policies and create proper consolidated ones

-- Drop existing conflicting policies for LinkedIn tasks
DROP POLICY IF EXISTS "Institute admins can manage institute job hunting assignments" ON public.job_hunting_assignments;
DROP POLICY IF EXISTS "Institute admins can manage institute job hunting assignments" ON public.job_hunting_assignments;

-- Drop existing duplicate/conflicting LinkedIn policies  
DROP POLICY IF EXISTS "Institute admins can update their institute linkedin tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can view student LinkedIn tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins can view their institute linkedin tasks" ON public.linkedin_user_tasks; 
DROP POLICY IF EXISTS "Institute admins manage institute LinkedIn tasks" ON public.linkedin_user_tasks;
DROP POLICY IF EXISTS "Institute admins see institute LinkedIn tasks" ON public.linkedin_user_tasks;

-- Create single comprehensive policy for LinkedIn user tasks
CREATE POLICY "Institute admins manage their institute LinkedIn tasks"
ON public.linkedin_user_tasks
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
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
  (
    has_role(auth.uid(), 'recruiter'::app_role) 
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = linkedin_user_tasks.user_id 
        AND ua.is_active = true
    )
  )
  OR
  (auth.uid() = linkedin_user_tasks.user_id)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
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
  (
    has_role(auth.uid(), 'recruiter'::app_role) 
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua 
      WHERE ua.user_id = linkedin_user_tasks.user_id 
        AND ua.is_active = true
    )
  )
  OR
  (auth.uid() = linkedin_user_tasks.user_id)
);