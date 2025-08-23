-- Add missing RLS policies for LinkedIn evidence and tasks visibility

-- Allow Institute admins to view LinkedIn evidence from their students
CREATE POLICY "Institute admins can view student LinkedIn evidence"
ON public.linkedin_evidence
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM linkedin_user_tasks lut
    JOIN linkedin_users lu ON lut.user_id = lu.id
    JOIN user_assignments ua ON ua.user_id = lu.auth_uid
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE lut.id = linkedin_evidence.user_task_id
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true
    AND iaa.is_active = true
  )
);

-- Allow Recruiters to view all LinkedIn evidence
CREATE POLICY "Recruiters can view all LinkedIn evidence"
ON public.linkedin_evidence
FOR SELECT
TO public
USING (has_role(auth.uid(), 'recruiter'::app_role));

-- Allow Recruiters to view all LinkedIn user tasks
CREATE POLICY "Recruiters can view all LinkedIn user tasks"
ON public.linkedin_user_tasks
FOR SELECT
TO public
USING (has_role(auth.uid(), 'recruiter'::app_role));

-- Allow Institute admins to update LinkedIn user tasks for verification
CREATE POLICY "Institute admins can update student LinkedIn tasks"
ON public.linkedin_user_tasks
FOR UPDATE
TO public
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM linkedin_users lu
    JOIN user_assignments ua ON ua.user_id = lu.auth_uid
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE lu.id = linkedin_user_tasks.user_id
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true
    AND iaa.is_active = true
  )
);

-- Allow Recruiters to update LinkedIn user tasks for verification
CREATE POLICY "Recruiters can update LinkedIn user tasks"
ON public.linkedin_user_tasks
FOR UPDATE
TO public
USING (has_role(auth.uid(), 'recruiter'::app_role));