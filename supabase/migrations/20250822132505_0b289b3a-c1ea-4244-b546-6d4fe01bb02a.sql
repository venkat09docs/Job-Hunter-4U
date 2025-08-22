-- Update the SELECT policy on career_task_assignments to include recruiters
DROP POLICY IF EXISTS "Institute admins can view their students' assignments" ON public.career_task_assignments;

CREATE POLICY "Institute admins and recruiters can view assignments" 
ON public.career_task_assignments 
FOR SELECT 
USING (
  -- Super admins can see all
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR
  -- Users can see their own assignments
  auth.uid() = user_id
  OR
  -- Recruiters can see all assignments
  public.has_role(auth.uid(), 'recruiter'::public.app_role)
  OR
  -- Institute admins can see assignments for students in their institutes
  (
    public.has_role(auth.uid(), 'institute_admin'::public.app_role)
    AND EXISTS (
      SELECT 1 
      FROM public.user_assignments ua
      JOIN public.institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
      WHERE ua.user_id = career_task_assignments.user_id
        AND iaa.user_id = auth.uid()
        AND ua.is_active = true
        AND iaa.is_active = true
    )
  )
);

-- Update the UPDATE policy on career_task_assignments to include recruiters
DROP POLICY IF EXISTS "Institute admins can update their students' assignments" ON public.career_task_assignments;

CREATE POLICY "Institute admins and recruiters can update assignments" 
ON public.career_task_assignments 
FOR UPDATE 
USING (
  -- Super admins can update all
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR
  -- Users can update their own assignments
  auth.uid() = user_id
  OR
  -- Recruiters can update all assignments
  public.has_role(auth.uid(), 'recruiter'::public.app_role)
  OR
  -- Institute admins can update assignments for students in their institutes
  (
    public.has_role(auth.uid(), 'institute_admin'::public.app_role)
    AND EXISTS (
      SELECT 1 
      FROM public.user_assignments ua
      JOIN public.institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
      WHERE ua.user_id = career_task_assignments.user_id
        AND iaa.user_id = auth.uid()
        AND ua.is_active = true
        AND iaa.is_active = true
    )
  )
);

-- Update the SELECT policy on career_task_evidence to include recruiters
DROP POLICY IF EXISTS "Institute admins can view their students' assignment evidence" ON public.career_task_evidence;

CREATE POLICY "Institute admins and recruiters can view assignment evidence" 
ON public.career_task_evidence 
FOR SELECT 
USING (
  -- Super admins can see all
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR
  -- Users can see evidence for their own assignments
  EXISTS (
    SELECT 1 FROM public.career_task_assignments cta 
    WHERE cta.id = career_task_evidence.assignment_id 
      AND cta.user_id = auth.uid()
  )
  OR
  -- Recruiters can see all evidence
  public.has_role(auth.uid(), 'recruiter'::public.app_role)
  OR
  -- Institute admins can see evidence for assignments of students in their institutes
  (
    public.has_role(auth.uid(), 'institute_admin'::public.app_role)
    AND EXISTS (
      SELECT 1 
      FROM public.career_task_assignments cta
      JOIN public.user_assignments ua ON cta.user_id = ua.user_id
      JOIN public.institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
      WHERE cta.id = career_task_evidence.assignment_id
        AND iaa.user_id = auth.uid()
        AND ua.is_active = true
        AND iaa.is_active = true
    )
  )
);