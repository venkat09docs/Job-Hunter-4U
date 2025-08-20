-- Update notification functions to exclude institute admins and recruiters from general notifications

-- Update the initialize_notification_preferences function to set different defaults for institute admins and recruiters
CREATE OR REPLACE FUNCTION public.initialize_notification_preferences(target_user_id uuid, user_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Delete existing preferences to avoid conflicts
    DELETE FROM notification_preferences WHERE user_id = target_user_id;
    
    IF user_role = 'institute_admin' THEN
        -- Institute admin specific notifications (only relevant ones enabled)
        INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
        (target_user_id, 'student_progress_alert', 'institute', true),
        (target_user_id, 'batch_completion_milestone', 'institute', true),
        (target_user_id, 'student_inactivity_alert', 'institute', true),
        (target_user_id, 'subscription_expiry_warning', 'institute', true),
        (target_user_id, 'weekly_institute_report', 'institute', true),
        -- Disable general notifications
        (target_user_id, 'new_job_posted', 'job', false),
        (target_user_id, 'profile_completion_reminder', 'profile', false),
        (target_user_id, 'achievement_unlocked', 'gamification', false),
        (target_user_id, 'milestone_reached', 'gamification', false),
        (target_user_id, 'job_application_reminder', 'job', false),
        (target_user_id, 'weekly_progress_summary', 'progress', false),
        (target_user_id, 'learning_goal_reminder', 'learning', false),
        (target_user_id, 'follow_up_reminder', 'job', false);
        
    ELSIF user_role = 'recruiter' THEN
        -- Recruiter specific notifications (only job-related ones enabled)
        INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
        (target_user_id, 'job_application_received', 'recruitment', true),
        (target_user_id, 'candidate_profile_match', 'recruitment', true),
        (target_user_id, 'interview_scheduled', 'recruitment', true),
        -- Disable general notifications
        (target_user_id, 'new_job_posted', 'job', false),
        (target_user_id, 'profile_completion_reminder', 'profile', false),
        (target_user_id, 'achievement_unlocked', 'gamification', false),
        (target_user_id, 'milestone_reached', 'gamification', false),
        (target_user_id, 'job_application_reminder', 'job', false),
        (target_user_id, 'weekly_progress_summary', 'progress', false),
        (target_user_id, 'learning_goal_reminder', 'learning', false),
        (target_user_id, 'follow_up_reminder', 'job', false);
        
    ELSE
        -- Regular user notifications (all enabled by default)
        INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
        (target_user_id, 'new_job_posted', 'job', true),
        (target_user_id, 'profile_completion_reminder', 'profile', true),
        (target_user_id, 'achievement_unlocked', 'gamification', true),
        (target_user_id, 'milestone_reached', 'gamification', true),
        (target_user_id, 'job_application_reminder', 'job', true),
        (target_user_id, 'weekly_progress_summary', 'progress', true),
        (target_user_id, 'learning_goal_reminder', 'learning', true),
        (target_user_id, 'follow_up_reminder', 'job', true);
    END IF;
END;
$$;

-- Update the job posting trigger to exclude institute admins and recruiters
CREATE OR REPLACE FUNCTION public.notify_job_posted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Update profile completion reminder function to exclude institute admins and recruiters
CREATE OR REPLACE FUNCTION public.send_profile_completion_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Send reminders to users with incomplete profiles (less than 70% complete)
  -- But exclude users with institute_admin or recruiter roles
  INSERT INTO public.notifications (user_id, title, message, type, is_read)
  SELECT 
    p.user_id,
    'Complete Your Profile',
    'Your profile is only ' || COALESCE(rd.completion_percentage, 0) || '% complete. Complete it to improve your job search success!',
    'profile_completion_reminder',
    false
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
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
    AND (ur.role IS NULL OR ur.role NOT IN ('institute_admin', 'recruiter')) -- Exclude institute admins and recruiters
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = p.user_id 
        AND n.type = 'profile_completion_reminder' 
        AND n.created_at > NOW() - INTERVAL '7 days'
    )
    AND should_send_notification(p.user_id, 'profile_completion_reminder') = true;
END;
$$;

-- Update learning goal reminder function to exclude institute admins and recruiters
CREATE OR REPLACE FUNCTION public.send_learning_goal_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Send reminders for overdue learning goals
  -- But exclude users with institute_admin or recruiter roles
  INSERT INTO public.notifications (user_id, title, message, type, related_id, is_read)
  SELECT 
    lg.user_id,
    'Learning Goal Reminder',
    'Your learning goal "' || lg.title || '" target date has passed. Time to update your progress!',
    'learning_goal_reminder',
    lg.id::text,
    false
  FROM public.learning_goals lg
  LEFT JOIN public.user_roles ur ON lg.user_id = ur.user_id
  WHERE lg.target_date < CURRENT_DATE
    AND lg.status != 'completed'
    AND (ur.role IS NULL OR ur.role NOT IN ('institute_admin', 'recruiter')) -- Exclude institute admins and recruiters
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = lg.user_id 
        AND n.type = 'learning_goal_reminder'
        AND n.related_id = lg.id::text
        AND n.created_at > NOW() - INTERVAL '3 days'
    )
    AND should_send_notification(lg.user_id, 'learning_goal_reminder') = true;
END;
$$;