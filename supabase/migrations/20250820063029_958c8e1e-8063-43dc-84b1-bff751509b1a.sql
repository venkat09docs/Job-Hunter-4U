-- Initialize notification preferences for existing users who don't have them
DO $$
DECLARE
    user_record record;
    user_role_val app_role;
BEGIN
    -- Loop through all users who don't have notification preferences
    FOR user_record IN 
        SELECT ur.user_id, ur.role 
        FROM user_roles ur 
        WHERE ur.user_id NOT IN (
            SELECT DISTINCT user_id FROM notification_preferences
        )
    LOOP
        user_role_val := user_record.role;
        
        -- User level notifications for all roles
        INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
        (user_record.user_id, 'profile_completion_reminder', 'profile_progress', true),
        (user_record.user_id, 'resume_progress_update', 'profile_progress', true),
        (user_record.user_id, 'linkedin_progress_update', 'profile_progress', true),
        (user_record.user_id, 'github_activity_reminder', 'profile_progress', true),
        (user_record.user_id, 'job_search_results', 'job_search', true),
        (user_record.user_id, 'job_application_reminder', 'job_search', true),
        (user_record.user_id, 'follow_up_reminder', 'job_search', true),
        (user_record.user_id, 'interview_preparation', 'job_search', true),
        (user_record.user_id, 'new_job_posted', 'job_opportunities', true),
        (user_record.user_id, 'job_match_found', 'job_opportunities', true),
        (user_record.user_id, 'learning_goal_reminder', 'learning', true),
        (user_record.user_id, 'skill_assessment_due', 'learning', true),
        (user_record.user_id, 'achievement_unlocked', 'achievements', true),
        (user_record.user_id, 'milestone_reached', 'achievements', true),
        (user_record.user_id, 'leaderboard_position', 'achievements', true),
        (user_record.user_id, 'weekly_progress_summary', 'reports', true),
        (user_record.user_id, 'monthly_progress_report', 'reports', true),
        (user_record.user_id, 'system_maintenance', 'system', true),
        (user_record.user_id, 'feature_announcement', 'system', true)
        ON CONFLICT (user_id, notification_type) DO NOTHING;

        -- Institute Admin level notifications
        IF user_role_val IN ('institute_admin', 'admin') THEN
            INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
            (user_record.user_id, 'new_student_enrollment', 'student_management', true),
            (user_record.user_id, 'student_progress_alert', 'student_management', true),
            (user_record.user_id, 'low_engagement_student', 'student_management', true),
            (user_record.user_id, 'student_milestone_achieved', 'student_management', true),
            (user_record.user_id, 'batch_completion_rate', 'batch_management', true),
            (user_record.user_id, 'batch_performance_summary', 'batch_management', true),
            (user_record.user_id, 'subscription_expiry_warning', 'subscription', true),
            (user_record.user_id, 'subscription_renewed', 'subscription', true),
            (user_record.user_id, 'usage_limit_approaching', 'subscription', true),
            (user_record.user_id, 'weekly_institute_report', 'reports', true),
            (user_record.user_id, 'monthly_institute_analytics', 'reports', true)
            ON CONFLICT (user_id, notification_type) DO NOTHING;
        END IF;

        -- Super Admin level notifications
        IF user_role_val = 'admin' THEN
            INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
            (user_record.user_id, 'new_institute_registration', 'institute_management', true),
            (user_record.user_id, 'institute_subscription_change', 'institute_management', true),
            (user_record.user_id, 'high_value_customer_activity', 'customer_management', true),
            (user_record.user_id, 'support_ticket_escalation', 'customer_management', true),
            (user_record.user_id, 'system_performance_alert', 'system_monitoring', true),
            (user_record.user_id, 'security_breach_alert', 'system_monitoring', true),
            (user_record.user_id, 'database_backup_status', 'system_monitoring', true),
            (user_record.user_id, 'revenue_milestone', 'business_metrics', true),
            (user_record.user_id, 'user_growth_report', 'business_metrics', true),
            (user_record.user_id, 'churn_rate_alert', 'business_metrics', true),
            (user_record.user_id, 'daily_system_summary', 'reports', true),
            (user_record.user_id, 'weekly_business_report', 'reports', true)
            ON CONFLICT (user_id, notification_type) DO NOTHING;
        END IF;

        -- Recruiter level notifications
        IF user_role_val IN ('recruiter', 'admin') THEN
            INSERT INTO notification_preferences (user_id, notification_type, category, is_enabled) VALUES
            (user_record.user_id, 'job_application_received', 'job_management', true),
            (user_record.user_id, 'job_posting_expiring', 'job_management', true),
            (user_record.user_id, 'candidate_profile_match', 'candidate_management', true),
            (user_record.user_id, 'interview_scheduled', 'candidate_management', true),
            (user_record.user_id, 'candidate_status_update', 'candidate_management', true),
            (user_record.user_id, 'hiring_goal_progress', 'performance', true),
            (user_record.user_id, 'recruiter_performance_report', 'performance', true)
            ON CONFLICT (user_id, notification_type) DO NOTHING;
        END IF;

        RAISE LOG 'Initialized notification preferences for user: %', user_record.user_id;
    END LOOP;
END $$;