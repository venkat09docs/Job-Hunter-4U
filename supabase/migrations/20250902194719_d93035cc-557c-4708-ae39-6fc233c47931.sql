-- Create optimized RPC functions for dashboard data consolidation

-- 1. Consolidated user points function
CREATE OR REPLACE FUNCTION public.get_user_points_consolidated(target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  total_points bigint,
  current_week_points bigint,
  current_month_points bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH date_ranges AS (
    SELECT 
      -- Current week (Monday to today)
      DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day' AS week_start,
      CURRENT_DATE AS week_end,
      -- Current month
      DATE_TRUNC('month', CURRENT_DATE) AS month_start,
      CURRENT_DATE AS month_end
  )
  SELECT 
    COALESCE(SUM(uap.points_earned), 0) as total_points,
    COALESCE(SUM(
      CASE 
        WHEN uap.activity_date >= dr.week_start AND uap.activity_date <= dr.week_end 
        THEN uap.points_earned 
        ELSE 0 
      END
    ), 0) as current_week_points,
    COALESCE(SUM(
      CASE 
        WHEN uap.activity_date >= dr.month_start AND uap.activity_date <= dr.month_end 
        THEN uap.points_earned 
        ELSE 0 
      END
    ), 0) as current_month_points
  FROM date_ranges dr
  LEFT JOIN public.user_activity_points uap ON uap.user_id = target_user_id;
$$;

-- 2. Consolidated dashboard stats function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_consolidated(target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  total_job_applications bigint,
  published_blogs_count bigint,
  saved_cover_letters_count bigint,
  saved_readme_files_count bigint,
  total_job_results_count bigint,
  job_status_counts jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    -- Total job applications (excluding wishlist and final statuses)
    (SELECT COUNT(*) FROM public.job_tracker 
     WHERE user_id = target_user_id 
     AND is_archived = false 
     AND status NOT IN ('wishlist', 'not_selected', 'no_response', 'archived')) as total_job_applications,
    
    -- Published blogs count
    (SELECT COUNT(*) FROM public.blogs 
     WHERE user_id = target_user_id AND is_public = true) as published_blogs_count,
    
    -- Saved cover letters count
    (SELECT COUNT(*) FROM public.saved_cover_letters 
     WHERE user_id = target_user_id) as saved_cover_letters_count,
    
    -- Saved README files count
    (SELECT COUNT(*) FROM public.saved_readme_files 
     WHERE user_id = target_user_id) as saved_readme_files_count,
    
    -- Total job results count
    (SELECT COUNT(*) FROM public.job_results 
     WHERE user_id = target_user_id) as total_job_results_count,
    
    -- Job status counts as JSON
    (
      SELECT jsonb_object_agg(status, count)
      FROM (
        SELECT 
          status,
          COUNT(*) as count
        FROM public.job_tracker 
        WHERE user_id = target_user_id
        AND (
          (status != 'archived' AND is_archived = false) OR 
          (status = 'archived' AND is_archived = true)
        )
        GROUP BY status
      ) status_counts
    ) as job_status_counts;
$$;

-- 3. Optimized leaderboard function with better performance
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