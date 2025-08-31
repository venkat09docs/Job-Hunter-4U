-- Create secure functions for badge leaders data that bypass RLS restrictions
-- These functions will safely return aggregated badge leader data for users with eligible subscriptions

-- Function to get profile build leaders (users with profile badges)
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
  SELECT 
    pub.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    COALESCE(SUM(uap.points_earned), 0)::integer as total_points,
    CASE 
      WHEN pb.tier = 'gold' THEN 'Gold'
      WHEN pb.tier = 'silver' THEN 'Silver'
      WHEN pb.tier = 'bronze' THEN 'Bronze'
      ELSE 'Bronze'
    END as badge_type,
    pub.awarded_at
  FROM public.profile_user_badges pub
  JOIN public.profile_badges pb ON pub.badge_id = pb.id
  JOIN public.profiles p ON pub.user_id = p.user_id
  LEFT JOIN public.user_activity_points uap ON pub.user_id = uap.user_id
  GROUP BY pub.user_id, p.username, p.full_name, p.profile_image_url, pb.tier, pub.awarded_at
  ORDER BY total_points DESC, pub.awarded_at DESC
  LIMIT 10;
$$;

-- Function to get job application leaders
CREATE OR REPLACE FUNCTION public.get_badge_leaders_job_apply()
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text,
  total_points integer,
  badge_type text,
  job_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    jt.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    (COUNT(*) * 10)::integer as total_points,
    CASE 
      WHEN COUNT(*) >= 30 THEN 'Diamond'
      WHEN COUNT(*) >= 14 THEN 'Gold'
      WHEN COUNT(*) >= 1 THEN 'Silver'
      ELSE 'Bronze'
    END as badge_type,
    COUNT(*) as job_count
  FROM public.job_tracker jt
  JOIN public.profiles p ON jt.user_id = p.user_id
  WHERE jt.status != 'wishlist'
    AND jt.is_archived = false
  GROUP BY jt.user_id, p.username, p.full_name, p.profile_image_url
  HAVING COUNT(*) >= 1
  ORDER BY job_count DESC
  LIMIT 10;
$$;

-- Function to get LinkedIn growth leaders
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
  SELECT 
    lnm.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    (SUM(lnm.value) * 5)::integer as total_points,
    CASE 
      WHEN SUM(lnm.value) >= 50 THEN 'Diamond'
      WHEN SUM(lnm.value) >= 25 THEN 'Gold'
      WHEN SUM(lnm.value) >= 10 THEN 'Silver'
      ELSE 'Bronze'
    END as badge_type,
    SUM(lnm.value) as network_count
  FROM public.linkedin_network_metrics lnm
  JOIN public.profiles p ON lnm.user_id = p.user_id
  GROUP BY lnm.user_id, p.username, p.full_name, p.profile_image_url
  HAVING SUM(lnm.value) >= 10
  ORDER BY network_count DESC
  LIMIT 10;
$$;

-- Function to get GitHub repository leaders
CREATE OR REPLACE FUNCTION public.get_badge_leaders_github_repository()
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text,
  total_points integer,
  badge_type text,
  repo_count bigint,
  commit_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH github_stats AS (
    SELECT 
      gr.user_id,
      COUNT(DISTINCT gr.id) as repos,
      COALESCE(SUM(
        CASE 
          WHEN ge.parsed_json ? 'weeklyMetrics' AND ge.parsed_json->'weeklyMetrics' ? 'commits' 
          THEN (ge.parsed_json->'weeklyMetrics'->>'commits')::integer 
          ELSE 0 
        END
      ), 0) as commits
    FROM public.github_repos gr
    LEFT JOIN public.github_user_tasks gut ON gr.user_id = gut.user_id
    LEFT JOIN public.github_evidence ge ON gut.id = ge.user_task_id 
      AND ge.verification_status = 'verified'
    WHERE gr.is_active = true
    GROUP BY gr.user_id
  )
  SELECT 
    gs.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    ((gs.repos * 50) + (gs.commits * 10))::integer as total_points,
    CASE 
      WHEN gs.repos >= 5 AND gs.commits >= 100 THEN 'Diamond'
      WHEN gs.repos >= 3 AND gs.commits >= 30 THEN 'Gold'
      WHEN gs.repos >= 1 AND gs.commits >= 5 THEN 'Silver'
      ELSE 'Bronze'
    END as badge_type,
    gs.repos as repo_count,
    gs.commits as commit_count
  FROM github_stats gs
  JOIN public.profiles p ON gs.user_id = p.user_id
  WHERE gs.repos >= 1 AND gs.commits >= 5
  ORDER BY total_points DESC
  LIMIT 10;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_badge_leaders_profile_build() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_badge_leaders_job_apply() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_badge_leaders_linkedin_growth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_badge_leaders_github_repository() TO authenticated;