-- Create weekly progress snapshots table for dynamic tracking
CREATE TABLE public.weekly_progress_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  resume_progress INTEGER NOT NULL DEFAULT 0,
  linkedin_progress INTEGER NOT NULL DEFAULT 0,
  github_progress INTEGER NOT NULL DEFAULT 0,
  network_progress INTEGER NOT NULL DEFAULT 0,
  job_applications_count INTEGER NOT NULL DEFAULT 0,
  published_blogs_count INTEGER NOT NULL DEFAULT 0,
  total_resume_opens INTEGER NOT NULL DEFAULT 0,
  total_job_searches INTEGER NOT NULL DEFAULT 0,
  total_ai_queries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable Row Level Security
ALTER TABLE public.weekly_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own weekly snapshots" 
ON public.weekly_progress_snapshots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can insert weekly snapshots" 
ON public.weekly_progress_snapshots 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update weekly snapshots" 
ON public.weekly_progress_snapshots 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_weekly_snapshots_updated_at
BEFORE UPDATE ON public.weekly_progress_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to capture weekly progress snapshot
CREATE OR REPLACE FUNCTION public.capture_weekly_progress_snapshot(p_user_id UUID, p_week_start DATE, p_week_end DATE)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_id UUID;
  v_resume_progress INTEGER := 0;
  v_linkedin_progress INTEGER := 0;
  v_github_progress INTEGER := 0;
  v_network_progress INTEGER := 0;
  v_job_applications INTEGER := 0;
  v_published_blogs INTEGER := 0;
  v_total_resume_opens INTEGER := 0;
  v_total_job_searches INTEGER := 0;
  v_total_ai_queries INTEGER := 0;
BEGIN
  -- Get current resume progress (calculate based on resume_data)
  SELECT CASE 
    WHEN rd.id IS NULL THEN 0
    ELSE GREATEST(0, LEAST(100, 
      COALESCE((
        (CASE WHEN (rd.personal_details->>'fullName') IS NOT NULL AND (rd.personal_details->>'fullName') != '' THEN 15 ELSE 0 END) +
        (CASE WHEN (rd.personal_details->>'email') IS NOT NULL AND (rd.personal_details->>'email') != '' THEN 10 ELSE 0 END) +
        (CASE WHEN (rd.personal_details->>'phone') IS NOT NULL AND (rd.personal_details->>'phone') != '' THEN 10 ELSE 0 END) +
        (CASE WHEN (rd.personal_details->>'location') IS NOT NULL AND (rd.personal_details->>'location') != '' THEN 5 ELSE 0 END) +
        (CASE WHEN jsonb_array_length(COALESCE(rd.experience, '[]'::jsonb)) > 0 THEN 20 ELSE 0 END) +
        (CASE WHEN jsonb_array_length(COALESCE(rd.education, '[]'::jsonb)) > 0 THEN 15 ELSE 0 END) +
        (CASE WHEN jsonb_array_length(COALESCE(rd.skills_interests->'skills', '[]'::jsonb)) > 0 THEN 15 ELSE 0 END) +
        (CASE WHEN rd.professional_summary IS NOT NULL AND rd.professional_summary != '' THEN 10 ELSE 0 END)
      ), 0))
    ))
  END INTO v_resume_progress
  FROM public.resume_data rd
  WHERE rd.user_id = p_user_id;

  -- Get LinkedIn progress from completed tasks (assuming 15 total tasks)
  SELECT COALESCE(ROUND((COUNT(*) * 100.0) / 15), 0) INTO v_linkedin_progress
  FROM public.linkedin_progress lp
  WHERE lp.user_id = p_user_id AND lp.completed = true;

  -- Get GitHub progress from completed tasks (assuming 5 total tasks)
  SELECT COALESCE(ROUND((COUNT(*) * 100.0) / 5), 0) INTO v_github_progress
  FROM public.github_progress gp
  WHERE gp.user_id = p_user_id AND gp.completed = true;

  -- Get network progress from completed tasks for the week
  SELECT COALESCE(ROUND((COUNT(DISTINCT lnc.task_id) * 100.0) / 5), 0) INTO v_network_progress
  FROM public.linkedin_network_completions lnc
  WHERE lnc.user_id = p_user_id 
    AND lnc.completed = true 
    AND lnc.date BETWEEN p_week_start AND p_week_end;

  -- Get job applications count
  SELECT COALESCE(COUNT(*), 0) INTO v_job_applications
  FROM public.job_tracker jt
  WHERE jt.user_id = p_user_id 
    AND jt.is_archived = false 
    AND jt.status != 'wishlist';

  -- Get published blogs count
  SELECT COALESCE(COUNT(*), 0) INTO v_published_blogs
  FROM public.blogs b
  WHERE b.user_id = p_user_id AND b.is_public = true;

  -- Get analytics from profile
  SELECT 
    COALESCE(p.total_resume_opens, 0),
    COALESCE(p.total_job_searches, 0),
    COALESCE(p.total_ai_queries, 0)
  INTO v_total_resume_opens, v_total_job_searches, v_total_ai_queries
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

  -- Insert or update weekly snapshot
  INSERT INTO public.weekly_progress_snapshots (
    user_id,
    week_start_date,
    week_end_date,
    resume_progress,
    linkedin_progress,
    github_progress,
    network_progress,
    job_applications_count,
    published_blogs_count,
    total_resume_opens,
    total_job_searches,
    total_ai_queries
  ) VALUES (
    p_user_id,
    p_week_start,
    p_week_end,
    v_resume_progress,
    v_linkedin_progress,
    v_github_progress,
    v_network_progress,
    v_job_applications,
    v_published_blogs,
    v_total_resume_opens,
    v_total_job_searches,
    v_total_ai_queries
  )
  ON CONFLICT (user_id, week_start_date)
  DO UPDATE SET
    week_end_date = EXCLUDED.week_end_date,
    resume_progress = EXCLUDED.resume_progress,
    linkedin_progress = EXCLUDED.linkedin_progress,
    github_progress = EXCLUDED.github_progress,
    network_progress = EXCLUDED.network_progress,
    job_applications_count = EXCLUDED.job_applications_count,
    published_blogs_count = EXCLUDED.published_blogs_count,
    total_resume_opens = EXCLUDED.total_resume_opens,
    total_job_searches = EXCLUDED.total_job_searches,
    total_ai_queries = EXCLUDED.total_ai_queries,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;