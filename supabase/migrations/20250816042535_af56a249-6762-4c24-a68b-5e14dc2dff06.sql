-- Fix function search path security warnings
-- Update the new function to have proper search path
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
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.full_name,
    p.profile_image_url
  FROM public.profiles p;
$$;

-- Update other functions that may have search path issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;