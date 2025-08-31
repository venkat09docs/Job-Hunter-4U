-- Update LinkedIn growth leaders function to match the exact Level Up badge conditions
-- Focus on connections as the primary criteria, same as BadgeProgressionMap component
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
  WITH connection_metrics AS (
    SELECT 
      lnm.user_id,
      -- Focus specifically on connections for badge eligibility (same as Level Up page)
      SUM(
        CASE 
          WHEN lnm.activity_id = 'connections' THEN lnm.value
          WHEN lnm.activity_id = 'connection_requests' THEN lnm.value
          ELSE 0
        END
      ) as total_connections,
      -- Count posts for Gold badge criteria
      SUM(
        CASE 
          WHEN lnm.activity_id = 'create_post' THEN lnm.value
          ELSE 0
        END
      ) as total_posts,
      -- Count profile views for Diamond badge criteria  
      SUM(
        CASE 
          WHEN lnm.activity_id = 'profile_views' THEN lnm.value
          ELSE 0
        END
      ) as total_profile_views
    FROM public.linkedin_network_metrics lnm
    WHERE lnm.value > 0
    GROUP BY lnm.user_id
  )
  SELECT 
    cm.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    (cm.total_connections * 5)::integer as total_points, -- 5 points per connection
    CASE 
      -- Diamond: 100+ connections AND 1000+ profile views (Level Up badge condition)
      WHEN cm.total_connections >= 100 AND cm.total_profile_views >= 1000 THEN 'Diamond'
      -- Gold: 50+ connections AND 5+ posts (Level Up badge condition) 
      WHEN cm.total_connections >= 50 AND cm.total_posts >= 5 THEN 'Gold'
      -- Silver: 25+ connections (Level Up badge condition)
      WHEN cm.total_connections >= 25 THEN 'Silver'
      ELSE 'Bronze'
    END as badge_type,
    cm.total_connections as network_count
  FROM connection_metrics cm
  JOIN public.profiles p ON cm.user_id = p.user_id
  WHERE cm.total_connections >= 25 -- Only show users who qualify for at least Silver badge
  ORDER BY 
    -- Prioritize badge tier first, then by connections
    CASE 
      WHEN cm.total_connections >= 100 AND cm.total_profile_views >= 1000 THEN 4 -- Diamond
      WHEN cm.total_connections >= 50 AND cm.total_posts >= 5 THEN 3 -- Gold
      WHEN cm.total_connections >= 25 THEN 2 -- Silver
      ELSE 1 -- Bronze (shouldn't appear due to WHERE clause)
    END DESC,
    cm.total_connections DESC
  LIMIT 10;
$$;