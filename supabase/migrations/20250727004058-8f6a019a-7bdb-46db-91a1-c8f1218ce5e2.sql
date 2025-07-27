-- Fix security issues by setting proper search_path for functions

-- Update the update_updated_at_column function to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the increment_user_analytics function to have proper search_path
CREATE OR REPLACE FUNCTION public.increment_user_analytics(
  action_type TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Insert or update today's analytics
  INSERT INTO public.user_analytics (user_id, date, resume_opens, job_searches, ai_queries)
  VALUES (
    current_user_id,
    CURRENT_DATE,
    CASE WHEN action_type = 'resume_open' THEN 1 ELSE 0 END,
    CASE WHEN action_type = 'job_search' THEN 1 ELSE 0 END,
    CASE WHEN action_type = 'ai_query' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    resume_opens = user_analytics.resume_opens + CASE WHEN action_type = 'resume_open' THEN 1 ELSE 0 END,
    job_searches = user_analytics.job_searches + CASE WHEN action_type = 'job_search' THEN 1 ELSE 0 END,
    ai_queries = user_analytics.ai_queries + CASE WHEN action_type = 'ai_query' THEN 1 ELSE 0 END,
    updated_at = now();

  -- Update total counts in profiles
  UPDATE public.profiles
  SET 
    total_resume_opens = total_resume_opens + CASE WHEN action_type = 'resume_open' THEN 1 ELSE 0 END,
    total_job_searches = total_job_searches + CASE WHEN action_type = 'job_search' THEN 1 ELSE 0 END,
    total_ai_queries = total_ai_queries + CASE WHEN action_type = 'ai_query' THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE user_id = current_user_id;
END;
$$;