-- Fix student statistics synchronization issues
-- This addresses the foreign key relationship and missing columns

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

-- Add missing columns to leaderboard_rankings if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_rankings' 
    AND column_name = 'weekly_points' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.leaderboard_rankings ADD COLUMN weekly_points INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard_rankings' 
    AND column_name = 'monthly_points' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.leaderboard_rankings ADD COLUMN monthly_points INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create function to refresh student statistics data
CREATE OR REPLACE FUNCTION public.refresh_student_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sync leaderboard rankings with current activity points
  INSERT INTO public.leaderboard_rankings (
    user_id,
    total_points,
    weekly_points,
    monthly_points,
    calculated_at
  )
  SELECT 
    p.user_id,
    COALESCE(SUM(uap.points_earned), 0) as total_points,
    COALESCE(SUM(CASE WHEN uap.activity_date >= CURRENT_DATE - INTERVAL '7 days' THEN uap.points_earned ELSE 0 END), 0) as weekly_points,
    COALESCE(SUM(CASE WHEN uap.activity_date >= CURRENT_DATE - INTERVAL '30 days' THEN uap.points_earned ELSE 0 END), 0) as monthly_points,
    NOW() as calculated_at
  FROM public.profiles p
  LEFT JOIN public.user_activity_points uap ON p.user_id = uap.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.leaderboard_rankings lr 
    WHERE lr.user_id = p.user_id 
    AND lr.calculated_at > CURRENT_DATE - INTERVAL '1 day'
  )
  GROUP BY p.user_id
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_points = EXCLUDED.total_points,
    weekly_points = EXCLUDED.weekly_points,
    monthly_points = EXCLUDED.monthly_points,
    calculated_at = EXCLUDED.calculated_at;

  -- Sync daily progress snapshots for all users
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
    published_blogs_count
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
    COALESCE((SELECT COUNT(*) FROM public.blogs b WHERE b.user_id = p.user_id AND b.is_public = true), 0) as published_blogs_count
  FROM public.profiles p
  LEFT JOIN public.resume_data rd ON p.user_id = rd.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.daily_progress_snapshots dps 
    WHERE dps.user_id = p.user_id 
    AND dps.snapshot_date = CURRENT_DATE
  )
  ON CONFLICT (user_id, snapshot_date) 
  DO UPDATE SET
    resume_progress = EXCLUDED.resume_progress,
    linkedin_progress = EXCLUDED.linkedin_progress,
    github_progress = EXCLUDED.github_progress,
    total_resume_opens = EXCLUDED.total_resume_opens,
    total_job_searches = EXCLUDED.total_job_searches,
    total_ai_queries = EXCLUDED.total_ai_queries,
    job_applications_count = EXCLUDED.job_applications_count,
    network_progress = EXCLUDED.network_progress,
    published_blogs_count = EXCLUDED.published_blogs_count,
    updated_at = NOW();
END;
$$;

-- Execute the synchronization function to fix existing data
SELECT public.refresh_student_statistics();

-- Grant proper permissions
ALTER FUNCTION public.refresh_student_statistics() OWNER TO postgres;