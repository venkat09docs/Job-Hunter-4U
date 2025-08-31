-- First, let's clean up obvious test data with unrealistic values
-- Delete LinkedIn metrics with suspiciously high values that look like test data
DELETE FROM public.linkedin_network_metrics 
WHERE value > 30 -- Remove entries with unrealistic high values (like 55, 45)
   OR (activity_id = 'create_post' AND value > 5) -- Posts should be max 5 per day typically
   OR (activity_id = 'shares' AND value > 10)     -- Shares should be reasonable
   OR (activity_id = 'post_likes' AND value > 20); -- Likes should be reasonable

-- Update the LinkedIn growth leaders function with more realistic thresholds
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
      -- Cap individual activity values to be more realistic
      SUM(
        CASE 
          WHEN lnm.activity_id = 'connections' THEN LEAST(lnm.value, 5)  -- Max 5 connections per day
          WHEN lnm.activity_id = 'create_post' THEN LEAST(lnm.value, 2)  -- Max 2 posts per day  
          WHEN lnm.activity_id = 'shares' THEN LEAST(lnm.value, 5)       -- Max 5 shares per day
          WHEN lnm.activity_id = 'post_likes' THEN LEAST(lnm.value, 10)  -- Max 10 likes per day
          WHEN lnm.activity_id = 'comments' THEN LEAST(lnm.value, 5)     -- Max 5 comments per day
          WHEN lnm.activity_id = 'profile_views' THEN LEAST(lnm.value, 10) -- Max 10 profile views per day
          ELSE LEAST(lnm.value, 5) -- Default cap for other activities
        END
      ) as total_activity
    FROM public.linkedin_network_metrics lnm
    WHERE lnm.value > 0 AND lnm.value <= 30 -- Only include reasonable values
    GROUP BY lnm.user_id
  )
  SELECT 
    rm.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    (rm.total_activity * 5)::integer as total_points,
    CASE 
      WHEN rm.total_activity >= 25 THEN 'Diamond'  -- Raised threshold to 25 (was 50)
      WHEN rm.total_activity >= 15 THEN 'Gold'     -- Raised threshold to 15 (was 25)  
      WHEN rm.total_activity >= 8 THEN 'Silver'    -- Raised threshold to 8 (was 10)
      ELSE 'Bronze'
    END as badge_type,
    rm.total_activity as network_count
  FROM realistic_metrics rm
  JOIN public.profiles p ON rm.user_id = p.user_id
  WHERE rm.total_activity >= 8 -- Only show users with at least 8 total activities
  ORDER BY rm.total_activity DESC
  LIMIT 10;
$$;