-- Fix search_path security issues in existing functions

-- Update get_subscription_days_remaining function
CREATE OR REPLACE FUNCTION public.get_subscription_days_remaining(user_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  end_date TIMESTAMPTZ;
  remaining_days INTEGER;
BEGIN
  SELECT subscription_end_date INTO end_date
  FROM public.profiles
  WHERE user_id = user_id_param;
  
  IF end_date IS NULL THEN
    RETURN 0;
  END IF;
  
  remaining_days := EXTRACT(DAY FROM (end_date - NOW()));
  
  IF remaining_days < 0 THEN
    RETURN 0;
  END IF;
  
  RETURN remaining_days;
END;
$function$;

-- Update increment_user_analytics function  
CREATE OR REPLACE FUNCTION public.increment_user_analytics(action_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;