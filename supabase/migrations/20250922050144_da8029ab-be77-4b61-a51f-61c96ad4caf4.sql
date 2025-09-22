-- Update Profile Build leaders functions to sync with Career Assignments page logic
-- Count points from ALL profile tasks (those with sub_category_id) not just RESUME module

-- Update global function
CREATE OR REPLACE FUNCTION public.get_badge_leaders_profile_build()
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text,
  total_points integer,
  badge_type text,
  awarded_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH profile_task_points AS (
    -- Calculate points from ALL profile tasks (those with sub_category_id) to match Career Assignments page
    SELECT 
      cta.user_id,
      SUM(cta.points_earned) as profile_build_points
    FROM career_task_assignments cta
    JOIN career_task_templates ctt ON cta.template_id = ctt.id
    WHERE cta.status = 'verified'
      AND ctt.sub_category_id IS NOT NULL  -- Profile tasks have sub_category_id
      AND ctt.is_active = true
    GROUP BY cta.user_id
  ),
  user_highest_badges AS (
    -- Get the highest badge for each user (Diamond > Gold > Silver > Bronze)
    SELECT DISTINCT ON (pub.user_id)
      pub.user_id,
      pb.code as badge_type,
      pub.awarded_at,
      -- Rank badges: Diamond=4, Gold=3, Silver=2, Bronze=1
      CASE pb.code
        WHEN 'profile_perfectionist' THEN 4  -- Diamond
        WHEN 'profile_complete' THEN 3       -- Gold  
        WHEN 'profile_rookie' THEN 2         -- Silver
        ELSE 1                               -- Bronze
      END as badge_rank
    FROM profile_user_badges pub
    JOIN profile_badges pb ON pub.badge_id = pb.id
    WHERE pb.code IN ('profile_rookie', 'profile_complete', 'profile_perfectionist')
      AND pb.is_active = true
    ORDER BY pub.user_id, badge_rank DESC, pub.awarded_at DESC
  )
  SELECT 
    uhb.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    COALESCE(ptp.profile_build_points, 0)::integer as total_points,
    CASE uhb.badge_type
      WHEN 'profile_perfectionist' THEN 'Diamond'
      WHEN 'profile_complete' THEN 'Gold'
      WHEN 'profile_rookie' THEN 'Silver'
      ELSE 'Bronze'
    END as badge_type,
    uhb.awarded_at
  FROM user_highest_badges uhb
  JOIN public.profiles p ON uhb.user_id = p.user_id
  LEFT JOIN profile_task_points ptp ON uhb.user_id = ptp.user_id
  ORDER BY 
    uhb.badge_rank DESC,  -- Highest badge first
    COALESCE(ptp.profile_build_points, 0) DESC,  -- Then by profile build points
    uhb.awarded_at DESC   -- Then by when badge was awarded
  LIMIT 10;
$$;

-- Update institute-specific function
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
          WHEN cta.status = 'verified' AND ctt.sub_category_id IS NOT NULL THEN cta.points_earned
          ELSE 0 
        END
      ), 0) as total_points,
      COUNT(
        CASE 
          WHEN cta.status = 'verified' AND ctt.sub_category_id IS NOT NULL THEN 1
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
      WHEN completed_tasks >= 25 THEN 'Gold'   -- Adjusted for all profile tasks (32 total)
      WHEN completed_tasks >= 15 THEN 'Silver' 
      WHEN completed_tasks >= 5 THEN 'Bronze'
      ELSE 'Bronze'
    END as badge_type
  FROM user_badge_summary
  WHERE total_points > 0
  ORDER BY total_points DESC, completed_tasks DESC
  LIMIT 10;
$$;