-- Remove the overly permissive recruiter policy that conflicts with proper role-based access
DROP POLICY IF EXISTS "Recruiters can view all LinkedIn evidence" ON public.linkedin_evidence;

-- Ensure we have the correct restrictive policy for recruiters (recreate if needed)
DROP POLICY IF EXISTS "Recruiters see non-institute LinkedIn evidence" ON public.linkedin_evidence;
CREATE POLICY "Recruiters see non-institute LinkedIn evidence" 
ON public.linkedin_evidence 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'recruiter'::app_role) 
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

-- Ensure institute admins can only see their institute's LinkedIn evidence
DROP POLICY IF EXISTS "Institute admins see institute LinkedIn evidence" ON public.linkedin_evidence;
CREATE POLICY "Institute admins see institute LinkedIn evidence" 
ON public.linkedin_evidence 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM linkedin_user_tasks lut
    JOIN user_assignments ua ON lut.user_id = ua.user_id
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE lut.id = linkedin_evidence.user_task_id
    AND iaa.user_id = auth.uid()
    AND ua.is_active = true
    AND iaa.is_active = true
  )
);