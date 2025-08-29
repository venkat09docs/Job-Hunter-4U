-- Clean up overlapping RLS policies on profiles table and ensure proper access for admin/recruiter verification

-- First, drop redundant/conflicting policies
DROP POLICY IF EXISTS "Recruiters can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Recruiters can view non-institute user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Institute admins can view student profiles" ON public.profiles;

-- Keep the main policies but ensure they work correctly
-- Update the admin policy to be more explicit
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the recruiter policy to be more explicit  
DROP POLICY IF EXISTS "Recruiters can view all profiles for verification" ON public.profiles;
CREATE POLICY "Recruiters can view all profiles for verification" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'recruiter'::app_role));

-- Ensure institute admins can view their assigned student profiles
CREATE POLICY "Institute admins can view assigned student profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = profiles.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);