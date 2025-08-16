-- Fix search path for functions to address security warnings

-- Update update_jobs_updated_at function with proper search path
CREATE OR REPLACE FUNCTION public.update_jobs_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update notify_job_posted function with proper search path
CREATE OR REPLACE FUNCTION public.notify_job_posted()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert notifications for all users assigned to institutes
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT DISTINCT ua.user_id,
    'New Job Posted',
    'A new job opportunity "' || NEW.title || '" at ' || NEW.company || ' has been posted!',
    'job_posted',
    NEW.id
  FROM public.user_assignments ua
  WHERE ua.is_active = true
    AND ua.user_id != NEW.posted_by; -- Don't notify the poster

  RETURN NEW;
END;
$$;