-- Fix profiles RLS policies for admin/recruiter access to verify assignments

-- Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "Admins and recruiters can view all profiles for verification" ON public.profiles;

-- Create a comprehensive policy for admins and recruiters to view profiles
CREATE POLICY "Admins and recruiters can view all profiles for verification" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'recruiter'::app_role)
    OR has_role(auth.uid(), 'institute_admin'::app_role)
    OR auth.uid() = user_id  -- Users can still view their own profiles
  )
);