-- Fix critical security vulnerability in profiles table
-- Remove overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated users can view basic profile info for leaderboard" ON public.profiles;

-- Create a database function that only returns safe, non-sensitive profile fields for leaderboard
CREATE OR REPLACE FUNCTION public.get_safe_leaderboard_profiles()
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.full_name,
    p.profile_image_url
  FROM public.profiles p;
$$;

-- Create a more restrictive policy for profiles - only allow users to see their own profiles and institute admins to see their students
CREATE POLICY "Restricted profile access for leaderboard" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Users can view their own profile
  auth.uid() = user_id 
  OR 
  -- Admins can view all profiles
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  -- Institute admins can view their institute users profiles
  (has_role(auth.uid(), 'institute_admin'::app_role) AND (EXISTS ( SELECT 1
   FROM (user_assignments ua
     JOIN institute_admin_assignments iaa ON ((ua.institute_id = iaa.institute_id)))
  WHERE ((ua.user_id = profiles.user_id) AND (iaa.user_id = auth.uid()) AND (ua.is_active = true) AND (iaa.is_active = true)))))
);