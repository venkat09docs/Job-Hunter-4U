-- Add a scheduled_for column to notifications table for follow-up reminders
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS scheduled_for date;

-- Add an index for efficient querying of scheduled notifications
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for 
ON public.notifications(scheduled_for, user_id, is_read);

-- Add a notification_type for follow-up reminders
ALTER TABLE public.notifications 
ALTER COLUMN type DROP DEFAULT;

-- Update the type constraint to include follow_up_reminder
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Create function to create follow-up reminder notifications
CREATE OR REPLACE FUNCTION public.create_follow_up_reminder(
  p_user_id uuid,
  p_job_id uuid,
  p_company_name text,
  p_job_title text,
  p_follow_up_date date
) RETURNS uuid
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

-- Create function to clean up follow-up reminders when job is deleted
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

-- Create trigger to cleanup notifications when job is deleted
DROP TRIGGER IF EXISTS cleanup_job_notifications_trigger ON public.job_tracker;
CREATE TRIGGER cleanup_job_notifications_trigger
  AFTER DELETE ON public.job_tracker
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_job_notifications();