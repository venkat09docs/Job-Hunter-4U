-- Update LinkedIn growth leaders function to use correct activity_id values from database
-- and match the Level Up badge conditions for LinkedIn network growth
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
      -- Calculate actual connections using the correct activity_id values
      SUM(
        CASE 
          WHEN lnm.activity_id = 'connections_accepted' THEN lnm.value
          WHEN lnm.activity_id = 'connection_requests' THEN lnm.value * 0.8  -- Assume 80% acceptance rate
          ELSE 0
        END
      ) as total_connections,
      -- Count posts for Gold badge criteria
      SUM(
        CASE 
          WHEN lnm.activity_id = 'create_post' THEN lnm.value
          WHEN lnm.activity_id = 'content' THEN lnm.value
          ELSE 0
        END
      ) as total_posts,
      -- Count profile views for Diamond badge criteria  
      SUM(
        CASE 
          WHEN lnm.activity_id = 'profile_views' THEN lnm.value
          ELSE 0
        END
      ) as total_profile_views,
      -- Calculate total network activity points
      SUM(
        CASE 
          WHEN lnm.activity_id IN ('connections_accepted', 'connection_requests') THEN lnm.value * 5
          WHEN lnm.activity_id IN ('create_post', 'content') THEN lnm.value * 3
          WHEN lnm.activity_id = 'profile_views' THEN lnm.value * 1
          ELSE lnm.value * 2
        END
      ) as total_network_points
    FROM public.linkedin_network_metrics lnm
    WHERE lnm.value > 0
    GROUP BY lnm.user_id
  )
  SELECT 
    cm.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    cm.total_network_points::integer as total_points,
    CASE 
      -- Diamond (Influencer in the Making): 100+ connections AND 1000+ profile views
      WHEN cm.total_connections >= 100 AND cm.total_profile_views >= 1000 THEN 'Diamond'
      -- Gold (Networker): 50+ connections AND 5+ posts per week  
      WHEN cm.total_connections >= 50 AND cm.total_posts >= 5 THEN 'Gold'
      -- Silver (Connector): 25+ new connections
      WHEN cm.total_connections >= 25 THEN 'Silver'
      -- Bronze: Some networking activity but below Silver threshold
      WHEN cm.total_connections >= 10 THEN 'Bronze'
      ELSE 'Bronze'
    END as badge_type,
    cm.total_connections as network_count
  FROM connection_metrics cm
  JOIN public.profiles p ON cm.user_id = p.user_id
  WHERE cm.total_connections >= 10 -- Show users with meaningful networking activity
  ORDER BY 
    -- Prioritize badge tier first, then by total points
    CASE 
      WHEN cm.total_connections >= 100 AND cm.total_profile_views >= 1000 THEN 4 -- Diamond
      WHEN cm.total_connections >= 50 AND cm.total_posts >= 5 THEN 3 -- Gold
      WHEN cm.total_connections >= 25 THEN 2 -- Silver
      ELSE 1 -- Bronze
    END DESC,
    cm.total_network_points DESC
  LIMIT 10;
$$;