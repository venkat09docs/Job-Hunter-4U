-- Apply more aggressive cleanup and realistic thresholds for LinkedIn metrics
CREATE OR REPLACE FUNCTION public.get_badge_leaders_linkedin_growth()
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text,
  total_points integer,
  badge_type text,
  network_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH realistic_metrics AS (
    SELECT 
      lnm.user_id,
      -- Apply much more realistic daily caps for LinkedIn activities
      SUM(
        CASE 
          WHEN lnm.activity_id = 'connections' THEN LEAST(lnm.value, 3)  -- Max 3 connections per day
          WHEN lnm.activity_id = 'create_post' THEN LEAST(lnm.value, 1)  -- Max 1 post per day  
          WHEN lnm.activity_id = 'shares' THEN LEAST(lnm.value, 3)       -- Max 3 shares per day
          WHEN lnm.activity_id = 'post_likes' THEN LEAST(lnm.value, 5)   -- Max 5 likes per day
          WHEN lnm.activity_id = 'comments' THEN LEAST(lnm.value, 3)     -- Max 3 comments per day
          WHEN lnm.activity_id = 'profile_views' THEN LEAST(lnm.value, 5) -- Max 5 profile views per day
          ELSE LEAST(lnm.value, 2) -- Default cap for other activities
        END
      ) as total_activity
    FROM public.linkedin_network_metrics lnm
    WHERE lnm.value > 0 AND lnm.value <= 15 -- Only include very reasonable values
    GROUP BY lnm.user_id
  ),
  final_metrics AS (
    SELECT 
      user_id,
      -- Cap the total activity to a realistic maximum (30 activities total)
      LEAST(total_activity, 30) as capped_activity
    FROM realistic_metrics
  )
  SELECT 
    fm.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    (fm.capped_activity * 5)::integer as total_points,
    CASE 
      WHEN fm.capped_activity >= 20 THEN 'Diamond'  -- 20+ activities = Diamond (100+ points)
      WHEN fm.capped_activity >= 12 THEN 'Gold'     -- 12+ activities = Gold (60+ points)
      WHEN fm.capped_activity >= 6 THEN 'Silver'    -- 6+ activities = Silver (30+ points)
      ELSE 'Bronze'
    END as badge_type,
    fm.capped_activity as network_count
  FROM final_metrics fm
  JOIN public.profiles p ON fm.user_id = p.user_id
  WHERE fm.capped_activity >= 6 -- Only show users with at least 6 total activities
  ORDER BY fm.capped_activity DESC
  LIMIT 10;
$$;