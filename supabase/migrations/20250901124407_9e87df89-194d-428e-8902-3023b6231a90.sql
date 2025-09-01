-- Fix the LinkedIn evidence RLS policy for institute admins
-- The current policy is not working because it's trying to join incorrectly

-- Drop the existing policy
DROP POLICY IF EXISTS "Institute admins can view student LinkedIn evidence" ON public.linkedin_evidence;

-- Create the corrected policy for institute admins
CREATE POLICY "Institute admins can view student LinkedIn evidence" 
ON public.linkedin_evidence
FOR SELECT 
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