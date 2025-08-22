-- Enable RLS on career_task_assignments if not already enabled
ALTER TABLE public.career_task_assignments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on career_task_evidence if not already enabled  
ALTER TABLE public.career_task_evidence ENABLE ROW LEVEL SECURITY;

-- Allow institute admins to view assignments for students assigned to their institutes
CREATE POLICY "Institute admins can view their students' assignments" 
ON public.career_task_assignments 
FOR SELECT 
USING (
  -- Super admins can see all
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR
  -- Users can see their own assignments
  auth.uid() = user_id
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

-- Allow institute admins to update assignments for verification
CREATE POLICY "Institute admins can update their students' assignments" 
ON public.career_task_assignments 
FOR UPDATE 
USING (
  -- Super admins can update all
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR
  -- Users can update their own assignments
  auth.uid() = user_id
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

-- Allow institute admins to view evidence for their students' assignments
CREATE POLICY "Institute admins can view their students' assignment evidence" 
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

-- Allow users to insert their own assignments
CREATE POLICY "Users can insert their own assignments" 
ON public.career_task_assignments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to insert evidence for their own assignments
CREATE POLICY "Users can insert evidence for their own assignments" 
ON public.career_task_evidence 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.career_task_assignments cta 
    WHERE cta.id = assignment_id 
      AND cta.user_id = auth.uid()
  )
);