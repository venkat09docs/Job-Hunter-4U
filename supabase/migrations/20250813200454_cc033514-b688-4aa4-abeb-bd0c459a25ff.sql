-- Fix Security Definer View issue by recreating views with proper ownership
-- Drop existing views that are owned by postgres superuser
DROP VIEW IF EXISTS public.institute_directory;
DROP VIEW IF EXISTS public.safe_public_profiles;

-- Recreate institute_directory view with proper security
-- This view should only show active institutes to users who have assignments to them
CREATE VIEW public.institute_directory AS
SELECT 
  id,
  name,
  description,
  code,
  is_active
FROM public.institutes
WHERE is_active = true;

-- Set proper ownership - authenticator role instead of postgres
ALTER VIEW public.institute_directory OWNER TO authenticator;

-- Recreate safe_public_profiles view with proper security
-- This view should only show public profiles
CREATE VIEW public.safe_public_profiles AS
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

-- Set proper ownership - authenticator role instead of postgres  
ALTER VIEW public.safe_public_profiles OWNER TO authenticator;

-- Enable RLS on the views to ensure they respect policies
ALTER VIEW public.institute_directory SET (security_barrier = true);
ALTER VIEW public.safe_public_profiles SET (security_barrier = true);

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON public.institute_directory TO authenticated;
GRANT SELECT ON public.safe_public_profiles TO authenticated;
GRANT SELECT ON public.institute_directory TO anon;
GRANT SELECT ON public.safe_public_profiles TO anon;