-- Create GitHub Repository leaders function to match Level Up badge conditions
-- Show users who have earned GitHub repository badges (Silver, Gold, Diamond)
CREATE OR REPLACE FUNCTION public.get_badge_leaders_github_repository()
RETURNS TABLE(
  user_id uuid,
  username text,
  full_name text,
  profile_image_url text,
  total_points integer,
  badge_type text,
  repos_count bigint,
  commits_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH github_metrics AS (
    SELECT 
      p.user_id,
      -- Count GitHub repositories
      COALESCE((
        SELECT COUNT(*) 
        FROM github_repos gr 
        WHERE gr.user_id = p.user_id AND gr.is_active = true
      ), 0) as repo_count,
      -- Count GitHub commits from signals
      COALESCE((
        SELECT COUNT(*) 
        FROM github_signals gs 
        WHERE gs.user_id = p.user_id AND gs.kind = 'commit'
      ), 0) as commit_count,
      -- Calculate points from GitHub weekly tasks
      COALESCE((
        SELECT SUM(gut.score_awarded)
        FROM github_user_tasks gut
        WHERE gut.user_id = p.user_id AND gut.status = 'VERIFIED'
      ), 0) as github_weekly_points
    FROM public.profiles p
    WHERE EXISTS (
      -- Only include users who have some GitHub activity
      SELECT 1 FROM github_repos gr WHERE gr.user_id = p.user_id AND gr.is_active = true
      UNION
      SELECT 1 FROM github_user_tasks gut WHERE gut.user_id = p.user_id AND gut.status = 'VERIFIED'
      UNION
      SELECT 1 FROM github_signals gs WHERE gs.user_id = p.user_id
    )
  )
  SELECT 
    gm.user_id,
    p.username,
    p.full_name,
    p.profile_image_url,
    gm.github_weekly_points::integer as total_points,
    CASE 
      -- Diamond: 5+ repositories AND 100+ commits (Level Up badge condition)
      WHEN gm.repo_count >= 5 AND gm.commit_count >= 100 THEN 'Diamond'
      -- Gold: 3+ repositories AND 50+ commits (Level Up badge condition)
      WHEN gm.repo_count >= 3 AND gm.commit_count >= 50 THEN 'Gold'
      -- Silver: 1+ repositories AND 5+ commits (Level Up badge condition)
      WHEN gm.repo_count >= 1 AND gm.commit_count >= 5 THEN 'Silver'
      -- Bronze: Some GitHub activity but below Silver threshold
      WHEN gm.repo_count >= 1 OR gm.commit_count >= 1 OR gm.github_weekly_points > 0 THEN 'Bronze'
      ELSE 'Bronze'
    END as badge_type,
    gm.repo_count as repos_count,
    gm.commit_count as commits_count
  FROM github_metrics gm
  JOIN public.profiles p ON gm.user_id = p.user_id
  WHERE 
    -- Show users who have at least earned Silver badge OR have meaningful GitHub activity
    (gm.repo_count >= 1 AND gm.commit_count >= 5) 
    OR gm.github_weekly_points >= 20  -- Alternative: high GitHub weekly points
  ORDER BY 
    -- Prioritize badge tier first, then by points
    CASE 
      WHEN gm.repo_count >= 5 AND gm.commit_count >= 100 THEN 4 -- Diamond
      WHEN gm.repo_count >= 3 AND gm.commit_count >= 50 THEN 3 -- Gold
      WHEN gm.repo_count >= 1 AND gm.commit_count >= 5 THEN 2 -- Silver
      ELSE 1 -- Bronze
    END DESC,
    gm.github_weekly_points DESC,
    gm.commit_count DESC,
    gm.repo_count DESC
  LIMIT 10;
$$;