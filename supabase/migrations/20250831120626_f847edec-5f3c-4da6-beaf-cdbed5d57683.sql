-- Fix RLS policies to allow recruiters to view job hunting assignments
CREATE POLICY "Recruiters can view submitted job hunting assignments" 
ON public.job_hunting_assignments 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND status IN ('submitted', 'verified', 'rejected')
);

-- Also allow recruiters to update assignments for verification
CREATE POLICY "Recruiters can update job hunting assignments for verification" 
ON public.job_hunting_assignments 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND status IN ('submitted', 'verified', 'rejected')
);

-- Allow institute admins to view job hunting assignments for their students
CREATE POLICY "Institute admins can view student job hunting assignments" 
ON public.job_hunting_assignments 
FOR SELECT 
USING (
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
);

-- Allow institute admins to update job hunting assignments for verification
CREATE POLICY "Institute admins can update student job hunting assignments" 
ON public.job_hunting_assignments 
FOR UPDATE 
USING (
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
);

-- Fix job hunting evidence RLS policies to allow recruiters to view evidence
CREATE POLICY "Recruiters can view job hunting evidence for verification" 
ON public.job_hunting_evidence 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1
    FROM job_hunting_assignments jha
    WHERE jha.id = job_hunting_evidence.assignment_id 
    AND jha.user_id = auth.uid()
  )
);

-- Allow institute admins to view job hunting evidence for their students
CREATE POLICY "Institute admins can view student job hunting evidence" 
ON public.job_hunting_evidence 
FOR SELECT 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM job_hunting_assignments jha
    JOIN user_assignments ua ON jha.user_id = ua.user_id
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE jha.id = job_hunting_evidence.assignment_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);