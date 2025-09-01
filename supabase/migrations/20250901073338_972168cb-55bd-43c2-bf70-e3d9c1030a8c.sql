-- Fix the job_tracker trigger function that also calls create_smart_notification with wrong parameter order
CREATE OR REPLACE FUNCTION public.notify_job_tracker_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Create follow-up reminder when job status changes to 'applied'
  IF NEW.status = 'applied' AND (OLD.status IS NULL OR OLD.status != 'applied') THEN
    PERFORM create_smart_notification(
      NEW.user_id,
      'follow_up_reminder',
      json_build_object(
        'job_title', NEW.title,
        'company', NEW.company,
        'related_id', NEW.id
      )::jsonb,
      '/job-tracker',
      'normal',                                        -- priority_param (5th parameter)
      (NEW.created_at + INTERVAL '3 days')           -- scheduled_for_param (6th parameter)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;