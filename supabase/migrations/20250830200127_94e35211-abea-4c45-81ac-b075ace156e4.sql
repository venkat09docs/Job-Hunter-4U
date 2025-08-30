-- Add RLS policies for github_evidence table to allow recruiters and admins to view evidence for verification
CREATE POLICY "Recruiters and admins can view GitHub evidence for verification"
ON public.github_evidence
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'recruiter'::app_role)
  OR has_role(auth.uid(), 'institute_admin'::app_role)
);