-- Create function to send email notifications when notifications are created
CREATE OR REPLACE FUNCTION public.send_email_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  email_response TEXT;
BEGIN
  -- Only send email for certain notification types and if user hasn't disabled emails
  IF NEW.type IN ('follow_up_reminder', 'new_job_posted', 'profile_completion_reminder', 'achievement_unlocked', 'milestone_reached', 'job_application_reminder', 'weekly_progress_summary', 'learning_goal_reminder') THEN
    
    -- Check if user has email notifications enabled for this type
    IF should_send_notification(NEW.user_id, NEW.type) THEN
      
      -- Call the email function asynchronously (will not block notification creation)
      BEGIN
        PERFORM net.http_post(
          url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/send-notification-email',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
          body := json_build_object(
            'user_id', NEW.user_id,
            'notification_type', NEW.type,
            'title', NEW.title,
            'message', NEW.message,
            'related_data', NEW.related_id
          )::jsonb
        );
        
        RAISE LOG 'Email notification sent for notification %', NEW.id;
      EXCEPTION
        WHEN OTHERS THEN
          -- Log error but don't fail the notification creation
          RAISE WARNING 'Failed to send email notification for %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to send email notifications
DROP TRIGGER IF EXISTS trigger_send_email_notification ON public.notifications;
CREATE TRIGGER trigger_send_email_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_email_notification();

-- Create function to send profile completion reminders
CREATE OR REPLACE FUNCTION public.send_profile_completion_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Send reminders to users with incomplete profiles (less than 70% complete)
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  SELECT 
    p.user_id,
    'Complete Your Profile',
    'Your profile is only ' || COALESCE(rd.completion_percentage, 0) || '% complete. Complete it to improve your job search success!',
    'profile_completion_reminder',
    false
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      user_id,
      CASE 
        WHEN personal_details IS NOT NULL AND experience IS NOT NULL AND education IS NOT NULL AND skills_interests IS NOT NULL THEN 100
        WHEN personal_details IS NOT NULL AND (experience IS NOT NULL OR education IS NOT NULL) THEN 75
        WHEN personal_details IS NOT NULL THEN 50
        ELSE 25
      END as completion_percentage
    FROM public.resume_data
  ) rd ON p.user_id = rd.user_id
  WHERE COALESCE(rd.completion_percentage, 0) < 70
    AND p.created_at < NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = p.user_id 
        AND n.type = 'profile_completion_reminder' 
        AND n.created_at > NOW() - INTERVAL '7 days'
    )
    AND should_send_notification(p.user_id, 'profile_completion_reminder') = true;
END;
$function$;

-- Create function to send learning goal reminders
CREATE OR REPLACE FUNCTION public.send_learning_goal_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Send reminders for overdue learning goals
  INSERT INTO public.notifications (user_id, title, message, type, related_id, is_read)
  SELECT 
    lg.user_id,
    'Learning Goal Reminder',
    'Your learning goal "' || lg.title || '" target date has passed. Time to update your progress!',
    'learning_goal_reminder',
    lg.id::text,
    false
  FROM public.learning_goals lg
  WHERE lg.target_date < CURRENT_DATE
    AND lg.status != 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = lg.user_id 
        AND n.type = 'learning_goal_reminder'
        AND n.related_id = lg.id::text
        AND n.created_at > NOW() - INTERVAL '3 days'
    )
    AND should_send_notification(lg.user_id, 'learning_goal_reminder') = true;
END;
$function$;

-- Create function to send achievement notifications based on profile total points
CREATE OR REPLACE FUNCTION public.notify_profile_achievement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  achievement_title TEXT;
  achievement_message TEXT;
  total_points INTEGER;
BEGIN
  -- Calculate total points from all activities
  total_points := COALESCE(NEW.total_resume_opens, 0) * 5 + 
                  COALESCE(NEW.total_job_searches, 0) * 3 + 
                  COALESCE(NEW.total_ai_queries, 0) * 2;

  -- Check for achievements based on total activity
  IF total_points >= 1000 AND 
     (COALESCE(OLD.total_resume_opens, 0) * 5 + 
      COALESCE(OLD.total_job_searches, 0) * 3 + 
      COALESCE(OLD.total_ai_queries, 0) * 2) < 1000 THEN
    achievement_title := 'Achievement Unlocked: Activity Master!';
    achievement_message := 'Congratulations! You''ve reached 1,000 activity points. You''re making great progress!';
  ELSIF NEW.total_resume_opens >= 50 AND COALESCE(OLD.total_resume_opens, 0) < 50 THEN
    achievement_title := 'Achievement Unlocked: Resume Pro!';
    achievement_message := 'Amazing! You''ve opened your resume 50 times. Your dedication to improvement shows!';
  ELSIF NEW.total_job_searches >= 100 AND COALESCE(OLD.total_job_searches, 0) < 100 THEN
    achievement_title := 'Achievement Unlocked: Job Hunter!';
    achievement_message := 'Incredible! You''ve performed 100 job searches. You''re actively pursuing opportunities!';
  ELSE
    RETURN NEW; -- No achievement to unlock
  END CASE;

  -- Send achievement notification
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  VALUES (
    NEW.user_id,
    achievement_title,
    achievement_message,
    'achievement_unlocked',
    false
  );

  RETURN NEW;
END;
$function$;

-- Create trigger for profile-based achievement notifications
DROP TRIGGER IF EXISTS trigger_profile_achievement ON public.profiles;
CREATE TRIGGER trigger_profile_achievement
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.total_resume_opens > OLD.total_resume_opens OR 
        NEW.total_job_searches > OLD.total_job_searches OR 
        NEW.total_ai_queries > OLD.total_ai_queries)
  EXECUTE FUNCTION public.notify_profile_achievement();

-- Create function to send weekly progress summaries
CREATE OR REPLACE FUNCTION public.send_weekly_progress_summaries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_record RECORD;
  progress_message TEXT;
  points_this_week INTEGER;
  activities_completed INTEGER;
BEGIN
  -- Send weekly summaries to active users
  FOR user_record IN
    SELECT DISTINCT p.user_id, p.full_name
    FROM public.profiles p
    JOIN public.user_activity_points uap ON p.user_id = uap.user_id
    WHERE uap.created_at >= NOW() - INTERVAL '7 days'
      AND should_send_notification(p.user_id, 'weekly_progress_summary') = true
  LOOP
    -- Calculate user's weekly progress
    SELECT 
      COALESCE(SUM(uap.points_earned), 0)::INTEGER,
      COUNT(*)::INTEGER
    INTO points_this_week, activities_completed
    FROM public.user_activity_points uap
    WHERE uap.user_id = user_record.user_id
      AND uap.created_at >= NOW() - INTERVAL '7 days';

    -- Create progress message
    progress_message := 'This week you earned ' || points_this_week || ' points from ' || activities_completed || ' activities. ';
    
    IF points_this_week > 100 THEN
      progress_message := progress_message || 'Excellent work! Keep up the momentum.';
    ELSIF points_this_week > 50 THEN
      progress_message := progress_message || 'Good progress! You''re building great habits.';
    ELSE
      progress_message := progress_message || 'Every step counts. Try to be more active next week!';
    END IF;

    -- Send weekly summary notification
    INSERT INTO public.notifications (user_id, title, message, type, is_read)
    VALUES (
      user_record.user_id,
      'Your Weekly Progress Summary',
      progress_message,
      'weekly_progress_summary',
      false
    );
  END LOOP;
END;
$function$;