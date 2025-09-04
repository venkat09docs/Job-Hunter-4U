-- Update leaderboard function to exclude institute users
CREATE OR REPLACE FUNCTION public.get_leaderboard_optimized(
  period_type text DEFAULT 'current_week',
  limit_count integer DEFAULT 5
)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  username text,
  profile_image_url text,
  total_points bigint,
  rank_position bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH date_range AS (
    SELECT 
      CASE 
        WHEN period_type = 'current_week' THEN 
          DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day'
        WHEN period_type = 'last_30_days' THEN 
          CURRENT_DATE - INTERVAL '30 days'
        ELSE 
          DATE '2020-01-01'
      END as start_date,
      CURRENT_DATE as end_date
  ),
  user_points AS (
    SELECT 
      uap.user_id,
      SUM(uap.points_earned) as total_points
    FROM public.user_activity_points uap
    CROSS JOIN date_range dr
    WHERE uap.activity_date >= dr.start_date 
      AND uap.activity_date <= dr.end_date
      -- Exclude institute users (users with active assignments)
      AND NOT EXISTS (
        SELECT 1 
        FROM public.user_assignments ua 
        WHERE ua.user_id = uap.user_id 
          AND ua.is_active = true
      )
    GROUP BY uap.user_id
    HAVING SUM(uap.points_earned) > 0
    ORDER BY SUM(uap.points_earned) DESC
    LIMIT limit_count + 10  -- Get extra in case current user not in top
  ),
  ranked_users AS (
    SELECT 
      up.user_id,
      up.total_points,
      ROW_NUMBER() OVER (ORDER BY up.total_points DESC) as rank_position
    FROM user_points up
  )
  SELECT 
    ru.user_id,
    p.full_name,
    p.username,
    p.profile_image_url,
    ru.total_points,
    ru.rank_position
  FROM ranked_users ru
  JOIN public.profiles p ON ru.user_id = p.user_id
  ORDER BY ru.rank_position
  LIMIT limit_count;
$$;