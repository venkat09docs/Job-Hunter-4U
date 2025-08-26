-- Allow recruiters to view profiles of users who have submitted assignments
CREATE POLICY "Recruiters can view profiles for assignment verification" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND (
    -- User has submitted career assignments
    EXISTS (
      SELECT 1 FROM public.career_task_assignments cta 
      WHERE cta.user_id = profiles.user_id 
      AND cta.status = 'submitted'
    )
    OR 
    -- User has submitted LinkedIn assignments
    EXISTS (
      SELECT 1 FROM public.linkedin_user_tasks lut 
      WHERE lut.user_id = profiles.user_id 
      AND lut.status = 'SUBMITTED'
    )
    OR
    -- User has submitted job hunting assignments
    EXISTS (
      SELECT 1 FROM public.job_hunting_assignments jha 
      Where jha.user_id = profiles.user_id 
      AND jha.status = 'submitted'
    )
  )
);