-- Create institute-specific leaderboard functions

-- Function to get institute-specific leaderboard profiles
CREATE OR REPLACE FUNCTION public.get_institute_leaderboard_profiles(institute_id_param uuid)
RETURNS TABLE(user_id uuid, username text, full_name text, profile_image_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.full_name,
    p.profile_image_url
  FROM public.profiles p
  INNER JOIN public.user_assignments ua ON p.user_id = ua.user_id
  WHERE ua.institute_id = institute_id_param
    AND ua.is_active = true;
$$;

-- Function to get institute-specific badge leaders for profile build
CREATE OR REPLACE FUNCTION public.get_institute_badge_leaders_profile_build(institute_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text,
  total_points integer,
  badge_type text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_badge_summary AS (
    SELECT 
      p.user_id,
      p.username,
      p.full_name,
      p.profile_image_url,
      COALESCE(SUM(
        CASE 
          WHEN cta.status = 'verified' AND ctt.module = 'RESUME' THEN cta.points_earned
          ELSE 0 
        END
      ), 0) as total_points,
      COUNT(
        CASE 
          WHEN cta.status = 'verified' AND ctt.module = 'RESUME' THEN 1
        END
      ) as completed_tasks
    FROM public.profiles p
    INNER JOIN public.user_assignments ua ON p.user_id = ua.user_id
    LEFT JOIN public.career_task_assignments cta ON p.user_id = cta.user_id
    LEFT JOIN public.career_task_templates ctt ON cta.template_id = ctt.id
    WHERE ua.institute_id = institute_id_param
      AND ua.is_active = true
    GROUP BY p.user_id, p.username, p.full_name, p.profile_image_url
  )
  SELECT 
    user_id,
    username,
    full_name,
    profile_image_url,
    total_points,
    CASE 
      WHEN completed_tasks >= 9 THEN 'Gold'
      WHEN completed_tasks >= 6 THEN 'Silver' 
      WHEN completed_tasks >= 3 THEN 'Bronze'
      ELSE 'Bronze'
    END as badge_type
  FROM user_badge_summary
  WHERE total_points > 0
  ORDER BY total_points DESC, completed_tasks DESC
  LIMIT 10;
$$;

-- Function to get institute-specific badge leaders for job applications  
CREATE OR REPLACE FUNCTION public.get_institute_badge_leaders_job_apply(institute_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text,
  total_points integer,
  badge_type text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_job_summary AS (
    SELECT 
      p.user_id,
      p.username,
      p.full_name,
      p.profile_image_url,
      COALESCE(COUNT(jt.id), 0) as job_applications,
      COALESCE(COUNT(jt.id) * 10, 0) as total_points
    FROM public.profiles p
    INNER JOIN public.user_assignments ua ON p.user_id = ua.user_id
    LEFT JOIN public.job_tracker jt ON p.user_id = jt.user_id
    WHERE ua.institute_id = institute_id_param
      AND ua.is_active = true
    GROUP BY p.user_id, p.username, p.full_name, p.profile_image_url
  )
  SELECT 
    user_id,
    username,
    full_name,
    profile_image_url,
    total_points,
    CASE 
      WHEN job_applications >= 20 THEN 'Gold'
      WHEN job_applications >= 10 THEN 'Silver'
      WHEN job_applications >= 5 THEN 'Bronze'
      ELSE 'Bronze'
    END as badge_type
  FROM user_job_summary
  WHERE job_applications > 0
  ORDER BY total_points DESC, job_applications DESC
  LIMIT 10;
$$;

-- Function to get institute-specific badge leaders for LinkedIn growth
CREATE OR REPLACE FUNCTION public.get_institute_badge_leaders_linkedin_growth(institute_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text,
  total_points integer,
  badge_type text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_linkedin_summary AS (
    SELECT 
      p.user_id,
      p.username,
      p.full_name,
      p.profile_image_url,
      COALESCE(COUNT(
        CASE 
          WHEN lp.completed = true THEN 1
        END
      ), 0) as completed_tasks,
      COALESCE(SUM(
        CASE 
          WHEN lp.completed = true THEN 10
          ELSE 0
        END
      ), 0) as total_points
    FROM public.profiles p
    INNER JOIN public.user_assignments ua ON p.user_id = ua.user_id
    LEFT JOIN public.linkedin_progress lp ON p.user_id = lp.user_id
    WHERE ua.institute_id = institute_id_param
      AND ua.is_active = true
    GROUP BY p.user_id, p.username, p.full_name, p.profile_image_url
  )
  SELECT 
    user_id,
    username,
    full_name,
    profile_image_url,
    total_points,
    CASE 
      WHEN completed_tasks >= 9 THEN 'Gold'
      WHEN completed_tasks >= 6 THEN 'Silver'
      WHEN completed_tasks >= 3 THEN 'Bronze'
      ELSE 'Bronze'
    END as badge_type
  FROM user_linkedin_summary
  WHERE total_points > 0
  ORDER BY total_points DESC, completed_tasks DESC
  LIMIT 10;
$$;

-- Function to get institute-specific badge leaders for GitHub repository
CREATE OR REPLACE FUNCTION public.get_institute_badge_leaders_github_repository(institute_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text,
  total_points integer,
  badge_type text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_github_summary AS (
    SELECT 
      p.user_id,
      p.username,
      p.full_name,
      p.profile_image_url,
      COALESCE(COUNT(
        CASE 
          WHEN gp.completed = true THEN 1
        END
      ), 0) as completed_tasks,
      COALESCE(SUM(
        CASE 
          WHEN gp.completed = true THEN 15
          ELSE 0
        END
      ), 0) as total_points
    FROM public.profiles p
    INNER JOIN public.user_assignments ua ON p.user_id = ua.user_id
    LEFT JOIN public.github_progress gp ON p.user_id = gp.user_id
    WHERE ua.institute_id = institute_id_param
      AND ua.is_active = true
    GROUP BY p.user_id, p.username, p.full_name, p.profile_image_url
  )
  SELECT 
    user_id,
    username,
    full_name,
    profile_image_url,
    total_points,
    CASE 
      WHEN completed_tasks >= 8 THEN 'Gold'
      WHEN completed_tasks >= 5 THEN 'Silver'
      WHEN completed_tasks >= 2 THEN 'Bronze'
      ELSE 'Bronze'
    END as badge_type
  FROM user_github_summary
  WHERE total_points > 0
  ORDER BY total_points DESC, completed_tasks DESC
  LIMIT 10;
$$;