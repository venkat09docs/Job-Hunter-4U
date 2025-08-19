-- Fix the get_safe_admin_profiles function to properly return all profiles for super admins
CREATE OR REPLACE FUNCTION public.get_safe_admin_profiles(user_ids uuid[] DEFAULT NULL::uuid[])
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
    -- Sanitize personal data
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.full_name
      ELSE 'REDACTED'
    END as full_name,
    CASE 
      WHEN public.has_role(auth.uid(), 'admin'::public.app_role) THEN p.username
      ELSE 'REDACTED'
    END as username,
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
    -- Super admins can see all profiles
    (
      public.has_role(auth.uid(), 'admin'::public.app_role) 
      AND (user_ids IS NULL OR p.user_id = ANY(user_ids))
    )
    OR
    -- Institute admins can only see users assigned to their institutes
    (
      public.has_role(auth.uid(), 'institute_admin'::public.app_role) 
      AND EXISTS (
        SELECT 1
        FROM public.user_assignments ua
        JOIN public.institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
        WHERE ua.user_id = p.user_id 
        AND iaa.user_id = auth.uid() 
        AND ua.is_active = true 
        AND iaa.is_active = true
      )
      AND (user_ids IS NULL OR p.user_id = ANY(user_ids))
    );
$$;