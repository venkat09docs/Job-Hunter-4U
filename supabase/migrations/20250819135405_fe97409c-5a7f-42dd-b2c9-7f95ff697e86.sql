-- Create a simpler function that works with the current authentication context
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(
  user_id uuid, 
  full_name text, 
  username text, 
  email text,
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
    p.email,
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
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role);
$$;