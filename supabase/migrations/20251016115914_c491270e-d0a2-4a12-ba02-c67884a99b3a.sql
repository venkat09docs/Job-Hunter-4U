-- Fix column name references in notify_job_posted function
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
    'A new job opportunity "' || NEW.title || '" at ' || NEW.company || ' has been posted!',
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

-- Add email column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS email text;