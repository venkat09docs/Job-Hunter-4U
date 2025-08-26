-- Drop the existing policy and create a simpler one for recruiters
DROP POLICY IF EXISTS "Recruiters can view profiles for assignment verification" ON public.profiles;

-- Allow recruiters to view all profiles (for assignment verification purposes)
CREATE POLICY "Recruiters can view all profiles for verification" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'recruiter'::app_role));