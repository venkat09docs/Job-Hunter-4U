-- Add RLS policy for recruiters to view all user profiles
CREATE POLICY "Recruiters can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'recruiter'::app_role));

-- Add RLS policy for recruiters to insert user activity points 
CREATE POLICY "Recruiters can insert user activity points"
ON public.user_activity_points
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'recruiter'::app_role));