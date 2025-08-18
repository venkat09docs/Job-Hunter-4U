-- PHASE 3: FIX REMAINING SECURITY WARNINGS
-- Address function search path and extension placement issues

-- 1. Update all remaining functions to set secure search path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.increment_user_analytics(action_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_subscription_days_remaining(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Move extensions from public schema to extensions schema
-- Note: This is informational - moving some extensions may break functionality
-- Extensions in public schema are detected. Consider moving them if possible.
-- This typically applies to extensions like pgcrypto, uuid-ossp, etc.
-- Moving extensions requires careful testing as it may break existing functions

-- 3. Add security monitoring functions
CREATE OR REPLACE FUNCTION public.log_suspicious_activity(
  activity_type text,
  description text,
  user_id_param uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_log (
    table_name,
    action,
    user_id,
    timestamp
  ) VALUES (
    'security_event',
    activity_type || ': ' || description,
    user_id_param,
    now()
  );
END;
$$;