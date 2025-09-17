-- Update course_sections policies to allow recruiters
DROP POLICY IF EXISTS "Super admins can manage course sections" ON public.course_sections;
CREATE POLICY "Admins and recruiters can manage course sections" 
ON public.course_sections 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'institute_admin'::app_role)
) 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'institute_admin'::app_role)
);

-- Update course_chapters policies to allow recruiters
DROP POLICY IF EXISTS "Super admins can manage course chapters" ON public.course_chapters;
CREATE POLICY "Admins and recruiters can manage course chapters" 
ON public.course_chapters 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'institute_admin'::app_role)
) 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'recruiter'::app_role) OR 
  has_role(auth.uid(), 'institute_admin'::app_role)
);