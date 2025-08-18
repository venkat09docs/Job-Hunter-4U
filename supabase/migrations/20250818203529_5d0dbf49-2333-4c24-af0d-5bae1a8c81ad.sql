-- PHASE 3D: COMPREHENSIVE FUNCTION SECURITY FIX
-- Update ALL remaining SECURITY DEFINER functions with secure search paths

-- Handle new user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Initialize notification preferences function  
CREATE OR REPLACE FUNCTION public.initialize_notification_preferences(target_user_id uuid, user_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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