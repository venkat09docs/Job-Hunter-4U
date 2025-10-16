-- Fix the notify_new_job_posted function to use UUID instead of text for related_id
CREATE OR REPLACE FUNCTION public.notify_new_job_posted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Send notifications to eligible users (exclude admins/recruiters)
  INSERT INTO notifications (user_id, title, message, type, category, action_url, related_id, is_read)
  SELECT DISTINCT 
    ua.user_id,
    'New Job Posted',
    'A new job opportunity "' || NEW.title || '" at ' || NEW.company || ' has been posted!',
    'new_job_posted',
    'job_hunting',
    '/job-search',
    NEW.id,  -- Fixed: removed ::text cast to keep it as UUID
    false
  FROM user_assignments ua
  LEFT JOIN user_roles ur ON ua.user_id = ur.user_id
  WHERE ua.is_active = true
    AND ua.user_id != NEW.posted_by -- Don't notify the poster
    AND should_send_notification(ua.user_id, 'new_job_posted') = true
    AND (ur.role IS NULL OR ur.role NOT IN ('institute_admin', 'recruiter'));

  RETURN NEW;
END;
$function$;