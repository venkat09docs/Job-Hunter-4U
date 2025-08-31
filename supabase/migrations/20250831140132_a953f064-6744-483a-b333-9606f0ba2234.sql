-- Fix LinkedIn growth leaders function points calculation 
-- Each user should get different points based on their individual activities
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
  WITH user_activity_metrics AS (
    SELECT 
      lnm.user_id,
      -- Calculate actual connections using correct activity_id values
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
      -- Calculate weighted points based on activity importance
      SUM(
        CASE 
          WHEN lnm.activity_id = 'connections_accepted' THEN lnm.value * 10    -- High value for actual connections
          WHEN lnm.activity_id = 'connection_requests' THEN lnm.value * 5     -- Medium value for requests
          WHEN lnm.activity_id = 'create_post' THEN lnm.value * 8             -- High value for content creation
          WHEN lnm.activity_id = 'content' THEN lnm.value * 6                 -- Medium-high for content
          WHEN lnm.activity_id = 'profile_views' THEN lnm.value * 2           -- Low value for views
          WHEN lnm.activity_id = 'comments' THEN lnm.value * 4                -- Medium value for engagement
          WHEN lnm.activity_id = 'post_likes' THEN lnm.value * 3              -- Lower value for likes
          WHEN lnm.activity_id = 'shares' THEN lnm.value * 7                  -- High value for shares
          WHEN lnm.activity_id = 'profile_optimization' THEN lnm.value * 5    -- Medium value for optimization
          ELSE lnm.value * 2                                                  -- Base value for other activities
        END
      ) as weighted_points
    FROM public.linkedin_network_metrics lnm
    WHERE lnm.value > 0
      AND lnm.user_id IS NOT NULL
    GROUP BY lnm.user_id
  )
  SELECT 
    uam.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    uam.weighted_points::integer as total_points,
    CASE 
      -- Diamond (Influencer in the Making): 100+ connections AND 1000+ profile views
      WHEN uam.total_connections >= 100 AND uam.total_profile_views >= 1000 THEN 'Diamond'
      -- Gold (Networker): 50+ connections AND 5+ posts per week  
      WHEN uam.total_connections >= 50 AND uam.total_posts >= 5 THEN 'Gold'
      -- Silver (Connector): 25+ new connections
      WHEN uam.total_connections >= 25 THEN 'Silver'
      -- Bronze: Some networking activity but below Silver threshold
      WHEN uam.total_connections >= 10 OR uam.weighted_points >= 50 THEN 'Bronze'
      ELSE 'Bronze'
    END as badge_type,
    uam.total_connections as network_count
  FROM user_activity_metrics uam
  JOIN public.profiles p ON uam.user_id = p.user_id
  WHERE uam.weighted_points > 0  -- Only show users with meaningful activity
  ORDER BY 
    -- Prioritize badge tier first, then by total points
    CASE 
      WHEN uam.total_connections >= 100 AND uam.total_profile_views >= 1000 THEN 4 -- Diamond
      WHEN uam.total_connections >= 50 AND uam.total_posts >= 5 THEN 3 -- Gold
      WHEN uam.total_connections >= 25 THEN 2 -- Silver
      ELSE 1 -- Bronze
    END DESC,
    uam.weighted_points DESC,  -- Order by actual calculated points per user
    uam.total_connections DESC
  LIMIT 10;
$$;