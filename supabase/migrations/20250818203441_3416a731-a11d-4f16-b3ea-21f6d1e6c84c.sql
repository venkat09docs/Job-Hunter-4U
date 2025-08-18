-- PHASE 3C: FIX MORE REMAINING FUNCTION SEARCH PATHS
-- Continue updating functions with secure search paths

CREATE OR REPLACE FUNCTION public.cleanup_job_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete follow-up notifications for the deleted job
  DELETE FROM public.notifications 
  WHERE related_id = OLD.id 
    AND type = 'follow_up_reminder';
  
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_follow_up_reminder(p_user_id uuid, p_job_id uuid, p_company_name text, p_job_title text, p_follow_up_date date)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Delete any existing follow-up notification for this job
  DELETE FROM public.notifications 
  WHERE user_id = p_user_id 
    AND related_id = p_job_id 
    AND type = 'follow_up_reminder';
  
  -- Create new follow-up reminder notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    scheduled_for,
    is_read
  ) VALUES (
    p_user_id,
    'Follow-up Reminder',
    'Time to follow up on your application for ' || p_job_title || ' at ' || p_company_name,
    'follow_up_reminder',
    p_job_id,
    p_follow_up_date,
    false
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_institute_student_count(institute_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(COUNT(ua.user_id), 0)::integer
  FROM public.user_assignments ua
  WHERE ua.institute_id = institute_id_param 
    AND ua.assignment_type = 'batch'
    AND ua.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_managed_institutes(user_id_param uuid)
RETURNS TABLE(institute_id uuid, institute_name text, institute_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.get_safe_institute_info(institute_id_param uuid)
RETURNS TABLE(id uuid, name text, code text, description text, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    i.id,
    i.name,
    i.code,
    i.description,
    i.is_active
  FROM public.institutes i
  WHERE i.id = institute_id_param
  AND i.is_active = true
  AND (
    -- User must be assigned to this institute OR have admin access
    EXISTS (
      SELECT 1
      FROM user_assignments ua
      WHERE ua.institute_id = institute_id_param 
      AND ua.user_id = auth.uid() 
      AND ua.is_active = true
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (
      has_role(auth.uid(), 'institute_admin'::app_role) 
      AND EXISTS (
        SELECT 1
        FROM institute_admin_assignments iaa
        WHERE iaa.user_id = auth.uid() 
        AND iaa.institute_id = institute_id_param
        AND iaa.is_active = true
      )
    )
  );
$$;