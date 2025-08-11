-- Fix security definer functions to have fixed search paths
-- This prevents potential security issues with search path manipulation

-- Update existing security definer functions to have fixed search paths
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
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

CREATE OR REPLACE FUNCTION public.is_institute_admin_for(user_id_param uuid, institute_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.institute_admin_assignments iaa
    WHERE iaa.user_id = user_id_param 
    AND iaa.institute_id = institute_id_param 
    AND iaa.is_active = true
  ) AND has_role(user_id_param, 'institute_admin'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.get_user_assignments(user_id_param uuid)
RETURNS TABLE(institute_id uuid, institute_name text, institute_code text, batch_id uuid, batch_name text, batch_code text, assignment_type text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ua.institute_id,
    i.name as institute_name,
    i.code as institute_code,
    ua.batch_id,
    b.name as batch_name,
    b.code as batch_code,
    ua.assignment_type
  FROM public.user_assignments ua
  LEFT JOIN public.institutes i ON ua.institute_id = i.id
  LEFT JOIN public.batches b ON ua.batch_id = b.id
  WHERE ua.user_id = user_id_param 
    AND ua.is_active = true
    AND (i.is_active = true OR i.is_active IS NULL)
    AND (b.is_active = true OR b.is_active IS NULL);
$$;

CREATE OR REPLACE FUNCTION public.get_managed_institutes(user_id_param uuid)
RETURNS TABLE(institute_id uuid, institute_name text, institute_code text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    i.id as institute_id,
    i.name as institute_name,
    i.code as institute_code
  FROM public.institutes i
  INNER JOIN public.institute_admin_assignments iaa ON i.id = iaa.institute_id
  WHERE iaa.user_id = user_id_param 
    AND iaa.is_active = true
    AND i.is_active = true;
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