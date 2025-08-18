-- Create secure function for admin access to profile data (excluding sensitive fields)
CREATE OR REPLACE FUNCTION public.get_safe_admin_profiles(user_ids uuid[] DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  username text,
  profile_image_url text,
  subscription_plan text,
  subscription_active boolean,
  subscription_start_date timestamp with time zone,
  subscription_end_date timestamp with time zone,
  total_resume_opens integer,
  total_job_searches integer,
  total_ai_queries integer,
  industry text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.username,
    p.profile_image_url,
    p.subscription_plan,
    p.subscription_active,
    p.subscription_start_date,
    p.subscription_end_date,
    p.total_resume_opens,
    p.total_job_searches,
    p.total_ai_queries,
    p.industry,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE 
    -- Only allow if user is admin or institute admin with proper access
    (
      has_role(auth.uid(), 'admin'::app_role) 
      OR 
      (
        has_role(auth.uid(), 'institute_admin'::app_role) 
        AND EXISTS (
          SELECT 1
          FROM user_assignments ua
          JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
          WHERE ua.user_id = p.user_id 
          AND iaa.user_id = auth.uid() 
          AND ua.is_active = true 
          AND iaa.is_active = true
        )
      )
    )
    -- Filter by specific user_ids if provided
    AND (user_ids IS NULL OR p.user_id = ANY(user_ids));
$$;

-- Create function for institute admins to get safe profile data for their users
CREATE OR REPLACE FUNCTION public.get_safe_institute_profiles(institute_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  username text,
  profile_image_url text,
  subscription_plan text,
  subscription_active boolean,
  total_resume_opens integer,
  total_job_searches integer,
  total_ai_queries integer,
  industry text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.username,
    p.profile_image_url,
    p.subscription_plan,
    p.subscription_active,
    p.total_resume_opens,
    p.total_job_searches,
    p.total_ai_queries,
    p.industry,
    p.created_at
  FROM public.profiles p
  JOIN public.user_assignments ua ON p.user_id = ua.user_id
  WHERE 
    ua.institute_id = institute_id_param
    AND ua.is_active = true
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR 
      (
        has_role(auth.uid(), 'institute_admin'::app_role) 
        AND EXISTS (
          SELECT 1
          FROM institute_admin_assignments iaa
          WHERE iaa.user_id = auth.uid() 
          AND iaa.institute_id = institute_id_param
          AND iaa.is_active = true
        )
      )
    );
$$;

-- Drop existing overly permissive admin policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Institute admins can view their institute users profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Institute admins can update their institute users profiles" ON public.profiles;

-- Create new restricted policies that don't expose sensitive data
CREATE POLICY "Admins can update non-sensitive profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  -- Prevent updating sensitive fields through RLS
  AND OLD.email IS NOT DISTINCT FROM NEW.email
  AND OLD.bio_link_url IS NOT DISTINCT FROM NEW.bio_link_url
  AND OLD.digital_profile_url IS NOT DISTINCT FROM NEW.digital_profile_url
  AND OLD.linkedin_url IS NOT DISTINCT FROM NEW.linkedin_url
  AND OLD.github_url IS NOT DISTINCT FROM NEW.github_url
  AND OLD.leetcode_url IS NOT DISTINCT FROM NEW.leetcode_url
);

CREATE POLICY "Institute admins can update non-sensitive fields for their users"
ON public.profiles
FOR UPDATE
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
)
WITH CHECK (
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
  -- Prevent updating sensitive fields
  AND OLD.email IS NOT DISTINCT FROM NEW.email
  AND OLD.bio_link_url IS NOT DISTINCT FROM NEW.bio_link_url
  AND OLD.digital_profile_url IS NOT DISTINCT FROM NEW.digital_profile_url
  AND OLD.linkedin_url IS NOT DISTINCT FROM NEW.linkedin_url
  AND OLD.github_url IS NOT DISTINCT FROM NEW.github_url
  AND OLD.leetcode_url IS NOT DISTINCT FROM NEW.leetcode_url
);