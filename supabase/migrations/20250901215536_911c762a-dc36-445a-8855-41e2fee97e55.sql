-- Fix the notify_job_posted function to use correct field names
CREATE OR REPLACE FUNCTION public.notify_job_posted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert notifications for users assigned to institutes who have this notification enabled
  -- But exclude users with institute_admin or recruiter roles
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT DISTINCT ua.user_id,
    'New Job Posted',
    'A new job opportunity "' || NEW.job_title || '" at ' || NEW.company_name || ' has been posted!',
    'new_job_posted',
    NEW.id
  FROM public.user_assignments ua
  LEFT JOIN public.user_roles ur ON ua.user_id = ur.user_id
  WHERE ua.is_active = true
    AND ua.user_id != NEW.posted_by -- Don't notify the poster
    AND should_send_notification(ua.user_id, 'new_job_posted') = true
    AND (ur.role IS NULL OR ur.role NOT IN ('institute_admin', 'recruiter')); -- Exclude institute admins and recruiters

  RETURN NEW;
END;
$function$;

-- Also check and fix any other function that might be referencing incorrect field names
CREATE OR REPLACE FUNCTION public.create_follow_up_reminder(p_user_id uuid, p_job_id uuid, p_company_name text, p_job_title text, p_follow_up_date date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;