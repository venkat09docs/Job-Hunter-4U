-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  category TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all notification preferences
CREATE POLICY "Admins can view all notification preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to get notification preference
CREATE OR REPLACE FUNCTION public.should_send_notification(target_user_id UUID, notif_type TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_enabled FROM notification_preferences 
     WHERE user_id = target_user_id AND notification_type = notif_type),
    true -- Default to enabled if no preference set
  );
$$;

-- Create function to initialize default notification preferences
CREATE OR REPLACE FUNCTION public.initialize_notification_preferences(target_user_id UUID, user_role app_role)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- User level notifications
  IF user_role IN ('user', 'admin', 'institute_admin', 'recruiter') THEN
    INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
    (target_user_id, 'profile_completion_reminder', 'profile_progress', true),
    (target_user_id, 'resume_progress_update', 'profile_progress', true),
    (target_user_id, 'linkedin_progress_update', 'profile_progress', true),
    (target_user_id, 'github_activity_reminder', 'profile_progress', true),
    (target_user_id, 'job_search_results', 'job_search', true),
    (target_user_id, 'job_application_reminder', 'job_search', true),
    (target_user_id, 'follow_up_reminder', 'job_search', true),
    (target_user_id, 'interview_preparation', 'job_search', true),
    (target_user_id, 'new_job_posted', 'job_opportunities', true),
    (target_user_id, 'job_match_found', 'job_opportunities', true),
    (target_user_id, 'learning_goal_reminder', 'learning', true),
    (target_user_id, 'skill_assessment_due', 'learning', true),
    (target_user_id, 'achievement_unlocked', 'achievements', true),
    (target_user_id, 'milestone_reached', 'achievements', true),
    (target_user_id, 'leaderboard_position', 'achievements', true),
    (target_user_id, 'weekly_progress_summary', 'reports', true),
    (target_user_id, 'monthly_progress_report', 'reports', true),
    (target_user_id, 'system_maintenance', 'system', true),
    (target_user_id, 'feature_announcement', 'system', true)
    ON CONFLICT (user_id, notification_type) DO NOTHING;
  END IF;

  -- Institute Admin level notifications
  IF user_role IN ('institute_admin', 'admin') THEN
    INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
    (target_user_id, 'new_student_enrollment', 'student_management', true),
    (target_user_id, 'student_progress_alert', 'student_management', true),
    (target_user_id, 'low_engagement_student', 'student_management', true),
    (target_user_id, 'student_milestone_achieved', 'student_management', true),
    (target_user_id, 'batch_completion_rate', 'batch_management', true),
    (target_user_id, 'batch_performance_summary', 'batch_management', true),
    (target_user_id, 'subscription_expiry_warning', 'subscription', true),
    (target_user_id, 'subscription_renewed', 'subscription', true),
    (target_user_id, 'usage_limit_approaching', 'subscription', true),
    (target_user_id, 'weekly_institute_report', 'reports', true),
    (target_user_id, 'monthly_institute_analytics', 'reports', true)
    ON CONFLICT (user_id, notification_type) DO NOTHING;
  END IF;

  -- Super Admin level notifications
  IF user_role = 'admin' THEN
    INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
    (target_user_id, 'new_institute_registration', 'institute_management', true),
    (target_user_id, 'institute_subscription_change', 'institute_management', true),
    (target_user_id, 'high_value_customer_activity', 'customer_management', true),
    (target_user_id, 'support_ticket_escalation', 'customer_management', true),
    (target_user_id, 'system_performance_alert', 'system_monitoring', true),
    (target_user_id, 'security_breach_alert', 'system_monitoring', true),
    (target_user_id, 'database_backup_status', 'system_monitoring', true),
    (target_user_id, 'revenue_milestone', 'business_metrics', true),
    (target_user_id, 'user_growth_report', 'business_metrics', true),
    (target_user_id, 'churn_rate_alert', 'business_metrics', true),
    (target_user_id, 'daily_system_summary', 'reports', true),
    (target_user_id, 'weekly_business_report', 'reports', true)
    ON CONFLICT (user_id, notification_type) DO NOTHING;
  END IF;

  -- Recruiter level notifications
  IF user_role IN ('recruiter', 'admin') THEN
    INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
    (target_user_id, 'job_application_received', 'job_management', true),
    (target_user_id, 'job_posting_expiring', 'job_management', true),
    (target_user_id, 'candidate_profile_match', 'candidate_management', true),
    (target_user_id, 'interview_scheduled', 'candidate_management', true),
    (target_user_id, 'candidate_status_update', 'candidate_management', true),
    (target_user_id, 'hiring_goal_progress', 'performance', true),
    (target_user_id, 'recruiter_performance_report', 'performance', true)
    ON CONFLICT (user_id, notification_type) DO NOTHING;
  END IF;
END;
$$;

-- Update handle_new_user function to initialize notification preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  webhook_response uuid;
  user_role app_role := 'user';
BEGIN
  -- Insert profile with proper data extraction
  INSERT INTO public.profiles (user_id, full_name, username, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- Initialize notification preferences
  PERFORM initialize_notification_preferences(NEW.id, user_role);
  
  -- Call webhook directly using pg_net
  SELECT INTO webhook_response
    net.http_post(
      url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := json_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'full_name', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
        'username', COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
        'created_at', NEW.created_at,
        'raw_user_meta_data', NEW.raw_user_meta_data
      )::jsonb
    );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update existing job notification trigger to respect preferences
CREATE OR REPLACE FUNCTION public.notify_job_posted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert notifications for all users assigned to institutes who have this notification enabled
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT DISTINCT ua.user_id,
    'New Job Posted',
    'A new job opportunity "' || NEW.title || '" at ' || NEW.company || ' has been posted!',
    'new_job_posted',
    NEW.id
  FROM public.user_assignments ua
  WHERE ua.is_active = true
    AND ua.user_id != NEW.posted_by -- Don't notify the poster
    AND should_send_notification(ua.user_id, 'new_job_posted') = true;

  RETURN NEW;
END;
$function$;