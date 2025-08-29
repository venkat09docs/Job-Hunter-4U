-- Add RLS policies for recruiters to access user profiles and leaderboard data

-- Allow recruiters to view profiles of non-institute users (users without active institute assignments)
CREATE POLICY "Recruiters can view non-institute user profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.user_id = profiles.user_id 
    AND ua.is_active = true
  )
);

-- Allow recruiters to view daily progress snapshots for non-institute users (for leaderboards)
CREATE POLICY "Recruiters can view non-institute user progress snapshots" 
ON public.daily_progress_snapshots 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.user_id = daily_progress_snapshots.user_id 
    AND ua.is_active = true
  )
);

-- Allow recruiters to view GitHub user badges for non-institute users
CREATE POLICY "Recruiters can view non-institute user GitHub badges" 
ON public.github_user_badges 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.user_id = github_user_badges.user_id 
    AND ua.is_active = true
  )
);

-- Allow recruiters to view profile user badges for non-institute users
CREATE POLICY "Recruiters can view non-institute user profile badges" 
ON public.profile_user_badges 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.user_id = profile_user_badges.user_id 
    AND ua.is_active = true
  )
);

-- Allow recruiters to view user activity points for non-institute users (for leaderboards)
CREATE POLICY "Recruiters can view non-institute user activity points" 
ON public.user_activity_points 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.user_id = user_activity_points.user_id 
    AND ua.is_active = true
  )
);

-- Allow recruiters to view leaderboard rankings for non-institute users
CREATE POLICY "Recruiters can view non-institute user leaderboard rankings" 
ON public.leaderboard_rankings 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.user_id = leaderboard_rankings.user_id 
    AND ua.is_active = true
  )
);

-- Allow recruiters to view LinkedIn progress for non-institute users
CREATE POLICY "Recruiters can view non-institute user LinkedIn progress" 
ON public.linkedin_progress 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.user_id = linkedin_progress.user_id 
    AND ua.is_active = true
  )
);

-- Allow recruiters to view GitHub progress for non-institute users
CREATE POLICY "Recruiters can view non-institute user GitHub progress" 
ON public.github_progress 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.user_id = github_progress.user_id 
    AND ua.is_active = true
  )
);

-- Allow recruiters to view career task assignments for non-institute users (for progress tracking)
CREATE POLICY "Recruiters can view non-institute user career assignments" 
ON public.career_task_assignments 
FOR SELECT 
USING (
  has_role(auth.uid(), 'recruiter'::app_role) 
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_assignments ua 
    WHERE ua.user_id = career_task_assignments.user_id 
    AND ua.is_active = true
  )
);