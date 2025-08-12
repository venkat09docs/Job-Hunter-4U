-- Fix the security definer view issue and improve the public profiles security

-- Drop the problematic security definer view
DROP VIEW IF EXISTS public.safe_public_profiles;

-- Create a safer view without SECURITY DEFINER
CREATE OR REPLACE VIEW public.safe_public_profiles AS
SELECT 
  slug,
  full_name,
  bio,
  profile_image_url,
  github_url,
  linkedin_url,
  blog_url,
  custom_links,
  created_at
FROM public.public_profiles 
WHERE is_public = true;

-- Apply RLS to the view as well
ALTER VIEW public.safe_public_profiles SET (security_barrier = true);

-- Update the access function to remove unnecessary complexity
-- This function should be used by applications for safe profile access
CREATE OR REPLACE FUNCTION public.get_safe_public_profile(profile_slug text)
RETURNS TABLE(
  slug text,
  full_name text,
  bio text,
  profile_image_url text,
  github_url text,
  linkedin_url text,
  blog_url text,
  custom_links jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.slug,
    p.full_name,
    p.bio,
    p.profile_image_url,
    p.github_url,
    p.linkedin_url,
    p.blog_url,
    p.custom_links,
    p.created_at
  FROM public.public_profiles p
  WHERE p.slug = profile_slug 
    AND p.is_public = true
  LIMIT 1;
$$;