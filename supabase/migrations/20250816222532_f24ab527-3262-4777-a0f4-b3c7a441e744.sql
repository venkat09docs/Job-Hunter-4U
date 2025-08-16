-- Create a secure leaderboard view that only exposes safe data
CREATE OR REPLACE VIEW public.safe_leaderboard_profiles AS
SELECT 
  p.user_id,
  p.username,
  p.full_name,
  p.profile_image_url,
  -- Explicitly exclude sensitive data like email, phone, subscription details
  p.created_at
FROM public.profiles p;

-- Make the view accessible to authenticated users
GRANT SELECT ON public.safe_leaderboard_profiles TO authenticated;

-- Create a security definer function to get safe leaderboard data
CREATE OR REPLACE FUNCTION public.get_safe_leaderboard_profiles()
RETURNS TABLE(
  user_id uuid, 
  username text, 
  full_name text, 
  profile_image_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.full_name,
    p.profile_image_url
  FROM public.profiles p;
$$;

-- Remove the dangerous policy that allows all authenticated users to view all profiles
DROP POLICY IF EXISTS "Authenticated users can view profiles for leaderboard" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles for leaderboard" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles for leaderboard" ON public.profiles;

-- Update the profiles table RLS policies to be more secure
-- Keep existing secure policies and ensure no overly broad access

-- Ensure admins can still view all profiles (they need this for management)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Keep the user's own profile access
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Keep institute admin access for their assigned users
DROP POLICY IF EXISTS "Institute admins can view their institute users profiles" ON public.profiles;
CREATE POLICY "Institute admins can view their institute users profiles" 
ON public.profiles 
FOR SELECT 
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

-- Ensure the leaderboard function is accessible
GRANT EXECUTE ON FUNCTION public.get_safe_leaderboard_profiles() TO authenticated;