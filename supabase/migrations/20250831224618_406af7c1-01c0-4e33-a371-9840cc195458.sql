-- Phase 3: Core Admin Notifications & Analytics (Simplified)

-- Create notification analytics table
CREATE TABLE IF NOT EXISTS notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'dismissed')),
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification schedules table for advanced scheduling
CREATE TABLE IF NOT EXISTS notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_code TEXT NOT NULL,
  target_audience JSONB NOT NULL DEFAULT '{}',
  schedule_config JSONB NOT NULL DEFAULT '{}', 
  template_variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  last_executed_at TIMESTAMPTZ,
  next_execution_at TIMESTAMPTZ,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin notification triggers table
CREATE TABLE IF NOT EXISTS admin_notification_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name TEXT NOT NULL UNIQUE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('assignment_pending', 'user_inactive', 'system_alert', 'milestone_reached')),
  conditions JSONB NOT NULL DEFAULT '{}',
  notification_template TEXT NOT NULL,
  target_roles TEXT[] DEFAULT '{"admin", "recruiter", "institute_admin"}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user notification settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  timezone TEXT DEFAULT 'UTC',
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  weekend_notifications BOOLEAN DEFAULT true,
  max_daily_notifications INTEGER DEFAULT 10,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('off', 'daily', 'weekly')),
  digest_time TIME DEFAULT '09:00',
  notification_methods JSONB DEFAULT '{"in_app": true, "email": true, "sms": false, "push": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add essential indexes
CREATE INDEX IF NOT EXISTS idx_notification_analytics_user_event ON notification_analytics(user_id, event_type, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_notification_analytics_notification ON notification_analytics(notification_id, event_type);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_execution ON notification_schedules(next_execution_at, is_active);

-- Enable RLS and create policies for new tables
DO $$
BEGIN
  -- Notification Analytics RLS
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_analytics' AND table_schema = 'public') THEN
    ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view their own notification analytics" ON notification_analytics;
    CREATE POLICY "Users can view their own notification analytics" 
    ON notification_analytics FOR SELECT 
    USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "Admins can view all notification analytics" ON notification_analytics;
    CREATE POLICY "Admins can view all notification analytics" 
    ON notification_analytics FOR SELECT 
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

    DROP POLICY IF EXISTS "System can insert analytics" ON notification_analytics;
    CREATE POLICY "System can insert analytics" 
    ON notification_analytics FOR INSERT 
    WITH CHECK (true);
  END IF;

  -- Admin Notification Triggers RLS
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_notification_triggers' AND table_schema = 'public') THEN
    ALTER TABLE admin_notification_triggers ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admins can manage notification triggers" ON admin_notification_triggers;
    CREATE POLICY "Admins can manage notification triggers" 
    ON admin_notification_triggers FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- User Notification Settings RLS
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_notification_settings' AND table_schema = 'public') THEN
    ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can manage their own notification settings" ON user_notification_settings;
    CREATE POLICY "Users can manage their own notification settings" 
    ON user_notification_settings FOR ALL 
    USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "Admins can view all notification settings" ON user_notification_settings;
    CREATE POLICY "Admins can view all notification settings" 
    ON user_notification_settings FOR SELECT 
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;

  -- Notification Schedules RLS
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_schedules' AND table_schema = 'public') THEN
    ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admins can manage notification schedules" ON notification_schedules;
    CREATE POLICY "Admins can manage notification schedules" 
    ON notification_schedules FOR ALL 
    USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));
  END IF;
END
$$;

-- Insert admin notification templates
INSERT INTO notification_templates (code, title, message_template, category, priority, variables, is_active) VALUES
('admin_assignments_pending', 'Assignments Awaiting Review', '{{pending_count}} assignments are waiting for your review. Students are eager for feedback!', 'admin', 'high', '["pending_count"]', true),
('admin_weekly_summary', 'Weekly Admin Summary', 'This week: {{new_users}} new users, {{completed_assignments}} assignments completed, {{pending_reviews}} pending reviews.', 'admin', 'medium', '["new_users", "completed_assignments", "pending_reviews"]', true),
('admin_user_milestone', 'User Achievement Alert', '{{user_name}} just completed {{milestone_type}}! They have earned {{total_points}} total points.', 'admin', 'medium', '["user_name", "milestone_type", "total_points"]', true),
('admin_system_alert', 'System Alert', '{{alert_type}}: {{message}}. Immediate attention may be required.', 'admin', 'critical', '["alert_type", "message"]', true),
('institute_student_inactive', 'Student Inactive Alert', 'Student {{student_name}} in {{institute_name}} has been inactive for {{days_inactive}} days.', 'institute', 'medium', '["student_name", "institute_name", "days_inactive"]', true),
('institute_batch_progress', 'Batch Progress Update', 'Batch {{batch_name}} progress: {{completion_percentage}}% complete. {{active_students}} active students.', 'institute', 'low', '["batch_name", "completion_percentage", "active_students"]', true),
('recruiter_candidate_ready', 'Candidate Profile Complete', '{{candidate_name}} has completed their profile! Resume: {{resume_score}}%, LinkedIn: {{linkedin_score}}%, GitHub: {{github_score}}%.', 'recruitment', 'high', '["candidate_name", "resume_score", "linkedin_score", "github_score"]', true),
('recruiter_job_applications', 'New Job Applications', '{{application_count}} new applications received for your posted jobs today.', 'recruitment', 'medium', '["application_count"]', true)
ON CONFLICT (code) DO UPDATE SET
  title = EXCLUDED.title,
  message_template = EXCLUDED.message_template,
  category = EXCLUDED.category,
  priority = EXCLUDED.priority,
  variables = EXCLUDED.variables,
  is_active = EXCLUDED.is_active;

-- Insert default admin notification triggers
INSERT INTO admin_notification_triggers (trigger_name, trigger_type, conditions, notification_template, target_roles) VALUES
('pending_assignments_daily', 'assignment_pending', '{"threshold": 5, "check_frequency": "daily"}', 'admin_assignments_pending', '{"admin", "recruiter", "institute_admin"}'),
('user_inactive_warning', 'user_inactive', '{"days_threshold": 7}', 'institute_student_inactive', '{"institute_admin"}'),
('weekly_summary', 'system_alert', '{"frequency": "weekly", "day": "monday"}', 'admin_weekly_summary', '{"admin", "recruiter"}')
ON CONFLICT (trigger_name) DO NOTHING;