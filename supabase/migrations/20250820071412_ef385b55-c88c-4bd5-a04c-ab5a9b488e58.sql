-- Fix student statistics synchronization issues
-- This addresses the foreign key relationship and data synchronization

-- First, add the foreign key constraint to user_activity_points table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_activity_points_user_id_fkey'
    AND table_name = 'user_activity_points'
  ) THEN
    ALTER TABLE public.user_activity_points 
    ADD CONSTRAINT user_activity_points_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_points_user_id ON public.user_activity_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_points_activity_date ON public.user_activity_points(activity_date);
CREATE INDEX IF NOT EXISTS idx_user_activity_points_activity_type ON public.user_activity_points(activity_type);

-- Create function to refresh student statistics data
CREATE OR REPLACE FUNCTION public.refresh_student_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update daily progress snapshots for all users to ensure current data
  INSERT INTO public.daily_progress_snapshots (
    user_id,
    snapshot_date,
    resume_progress,
    linkedin_progress,
    github_progress,
    total_resume_opens,
    total_job_searches,
    total_ai_queries,
    job_applications_count,
    network_progress,
    published_blogs_count,
    created_at,
    updated_at
  )
  SELECT 
    p.user_id,
    CURRENT_DATE,
    -- Calculate resume progress
    CASE 
      WHEN rd.personal_details IS NOT NULL 
        AND rd.experience IS NOT NULL 
        AND rd.education IS NOT NULL 
        AND rd.skills_interests IS NOT NULL 
        AND rd.professional_summary IS NOT NULL 
      THEN 100
      WHEN rd.personal_details IS NOT NULL 
        AND (rd.experience IS NOT NULL OR rd.education IS NOT NULL)
        AND (rd.skills_interests IS NOT NULL OR rd.professional_summary IS NOT NULL)
      THEN 75
      WHEN rd.personal_details IS NOT NULL 
        AND (rd.experience IS NOT NULL OR rd.education IS NOT NULL OR rd.skills_interests IS NOT NULL)
      THEN 50
      WHEN rd.personal_details IS NOT NULL 
      THEN 25
      ELSE 0
    END as resume_progress,
    -- Calculate LinkedIn progress based on completed tasks
    LEAST(100, COALESCE((
      SELECT COUNT(*) * 100 / 9 
      FROM public.linkedin_progress lp 
      WHERE lp.user_id = p.user_id AND lp.completed = true
    ), 0)) as linkedin_progress,
    -- Calculate GitHub progress based on profile setup tasks
    LEAST(100, COALESCE((
      SELECT COUNT(*) * 100 / 4
      FROM public.github_progress gp 
      WHERE gp.user_id = p.user_id 
        AND gp.completed = true 
        AND gp.task_id IN ('readme_generated', 'special_repo_created', 'readme_added', 'repo_public')
    ), 0)) as github_progress,
    COALESCE(p.total_resume_opens, 0),
    COALESCE(p.total_job_searches, 0),
    COALESCE(p.total_ai_queries, 0),
    COALESCE((SELECT COUNT(*) FROM public.job_tracker jt WHERE jt.user_id = p.user_id), 0) as job_applications_count,
    COALESCE((
      SELECT GREATEST(
        COALESCE(MAX(lnm.value) FILTER (WHERE lnm.activity_id = 'connections'), 0),
        COALESCE(MAX(lnm.value) FILTER (WHERE lnm.activity_id = 'posts'), 0)
      )
      FROM public.linkedin_network_metrics lnm 
      WHERE lnm.user_id = p.user_id
    ), 0) as network_progress,
    COALESCE((SELECT COUNT(*) FROM public.blogs b WHERE b.user_id = p.user_id AND b.is_public = true), 0) as published_blogs_count,
    NOW(),
    NOW()
  FROM public.profiles p
  LEFT JOIN public.resume_data rd ON p.user_id = rd.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.daily_progress_snapshots dps 
    WHERE dps.user_id = p.user_id 
    AND dps.snapshot_date = CURRENT_DATE
  );

  -- Update existing daily snapshots for today if they exist but are outdated
  UPDATE public.daily_progress_snapshots 
  SET 
    resume_progress = CASE 
      WHEN rd.personal_details IS NOT NULL 
        AND rd.experience IS NOT NULL 
        AND rd.education IS NOT NULL 
        AND rd.skills_interests IS NOT NULL 
        AND rd.professional_summary IS NOT NULL 
      THEN 100
      WHEN rd.personal_details IS NOT NULL 
        AND (rd.experience IS NOT NULL OR rd.education IS NOT NULL)
        AND (rd.skills_interests IS NOT NULL OR rd.professional_summary IS NOT NULL)
      THEN 75
      WHEN rd.personal_details IS NOT NULL 
        AND (rd.experience IS NOT NULL OR rd.education IS NOT NULL OR rd.skills_interests IS NOT NULL)
      THEN 50
      WHEN rd.personal_details IS NOT NULL 
      THEN 25
      ELSE 0
    END,
    linkedin_progress = LEAST(100, COALESCE((
      SELECT COUNT(*) * 100 / 9 
      FROM public.linkedin_progress lp 
      WHERE lp.user_id = daily_progress_snapshots.user_id AND lp.completed = true
    ), 0)),
    github_progress = LEAST(100, COALESCE((
      SELECT COUNT(*) * 100 / 4
      FROM public.github_progress gp 
      WHERE gp.user_id = daily_progress_snapshots.user_id 
        AND gp.completed = true 
        AND gp.task_id IN ('readme_generated', 'special_repo_created', 'readme_added', 'repo_public')
    ), 0)),
    job_applications_count = COALESCE((SELECT COUNT(*) FROM public.job_tracker jt WHERE jt.user_id = daily_progress_snapshots.user_id), 0),
    network_progress = COALESCE((
      SELECT GREATEST(
        COALESCE(MAX(lnm.value) FILTER (WHERE lnm.activity_id = 'connections'), 0),
        COALESCE(MAX(lnm.value) FILTER (WHERE lnm.activity_id = 'posts'), 0)
      )
      FROM public.linkedin_network_metrics lnm 
      WHERE lnm.user_id = daily_progress_snapshots.user_id
    ), 0),
    published_blogs_count = COALESCE((SELECT COUNT(*) FROM public.blogs b WHERE b.user_id = daily_progress_snapshots.user_id AND b.is_public = true), 0),
    updated_at = NOW()
  FROM public.profiles p
  LEFT JOIN public.resume_data rd ON p.user_id = rd.user_id
  WHERE daily_progress_snapshots.user_id = p.user_id
    AND daily_progress_snapshots.snapshot_date = CURRENT_DATE
    AND daily_progress_snapshots.updated_at < NOW() - INTERVAL '1 hour';

  -- Insert fresh leaderboard rankings for current period
  INSERT INTO public.leaderboard_rankings (
    user_id,
    period_type,
    total_points,
    rank_position,
    period_start,
    period_end,
    calculated_at
  )
  SELECT 
    p.user_id,
    'current_week' as period_type,
    COALESCE(SUM(uap.points_earned), 0) as total_points,
    1 as rank_position, -- Will be updated by ranking logic later
    DATE_TRUNC('week', CURRENT_DATE) as period_start,
    DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days' as period_end,
    NOW() as calculated_at
  FROM public.profiles p
  LEFT JOIN public.user_activity_points uap ON p.user_id = uap.user_id
    AND uap.activity_date >= DATE_TRUNC('week', CURRENT_DATE)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.leaderboard_rankings lr 
    WHERE lr.user_id = p.user_id 
    AND lr.period_type = 'current_week'
    AND lr.period_start = DATE_TRUNC('week', CURRENT_DATE)
  )
  GROUP BY p.user_id;
END;
$$;

-- Execute the synchronization function to fix existing data
SELECT public.refresh_student_statistics();

-- Grant proper permissions
ALTER FUNCTION public.refresh_student_statistics() OWNER TO postgres;

-- Create a simple function to manually trigger data sync when needed
CREATE OR REPLACE FUNCTION public.sync_student_data_now()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.refresh_student_statistics();
  RETURN 'Student statistics synchronized successfully';
END;
$$;

COMMENT ON FUNCTION public.sync_student_data_now() IS 'Manual trigger to synchronize all student statistics data';