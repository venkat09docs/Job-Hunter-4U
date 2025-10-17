-- Add DELETE policy for recruiters to delete their own job postings
CREATE POLICY "Recruiters can delete their own jobs"
ON public.jobs
FOR DELETE
TO public
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND auth.uid() = posted_by
);