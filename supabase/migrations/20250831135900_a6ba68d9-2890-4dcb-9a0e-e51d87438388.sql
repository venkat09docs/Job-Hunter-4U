-- Update Profile Build leaders function to show each user only once with their highest badge
-- and calculate points only from profile build (RESUME module) activities
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
  WITH resume_task_points AS (
    -- Calculate points only from RESUME module (profile build) activities
    SELECT 
      cta.user_id,
      SUM(cta.points_earned) as profile_build_points
    FROM career_task_assignments cta
    JOIN career_task_templates ctt ON cta.template_id = ctt.id
    WHERE cta.status = 'verified'
      AND ctt.module = 'RESUME'
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
    COALESCE(rtp.profile_build_points, 0)::integer as total_points,
    CASE uhb.badge_type
      WHEN 'profile_perfectionist' THEN 'Diamond'
      WHEN 'profile_complete' THEN 'Gold'
      WHEN 'profile_rookie' THEN 'Silver'
      ELSE 'Bronze'
    END as badge_type,
    uhb.awarded_at
  FROM user_highest_badges uhb
  JOIN public.profiles p ON uhb.user_id = p.user_id
  LEFT JOIN resume_task_points rtp ON uhb.user_id = rtp.user_id
  ORDER BY 
    uhb.badge_rank DESC,  -- Highest badge first
    COALESCE(rtp.profile_build_points, 0) DESC,  -- Then by profile build points
    uhb.awarded_at DESC   -- Then by when badge was awarded
  LIMIT 10;
$$;