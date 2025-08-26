-- Add RLS policy for recruiters to view profiles
CREATE POLICY "Recruiters can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'recruiter'::app_role)
);