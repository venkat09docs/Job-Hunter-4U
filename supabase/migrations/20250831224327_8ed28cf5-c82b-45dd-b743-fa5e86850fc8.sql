-- Phase 3: Admin Notifications, Advanced Scheduling & Analytics

-- Create notification analytics table
CREATE TABLE notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'dismissed')),
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification schedules table for advanced scheduling
CREATE TABLE notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_code TEXT NOT NULL,
  target_audience JSONB NOT NULL DEFAULT '{}', -- criteria for who gets it
  schedule_config JSONB NOT NULL DEFAULT '{}', -- cron, frequency, time zones
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
CREATE TABLE admin_notification_triggers (
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

-- Create notification delivery log for detailed tracking
CREATE TABLE notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('in_app', 'email', 'sms', 'push')),
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  delivery_timestamp TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT,
  provider_response JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user notification preferences enhanced table
CREATE TABLE user_notification_settings (
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

-- Add indexes for performance
CREATE INDEX idx_notification_analytics_user_event ON notification_analytics(user_id, event_type, event_timestamp);
CREATE INDEX idx_notification_analytics_notification ON notification_analytics(notification_id, event_type);
CREATE INDEX idx_notification_schedules_execution ON notification_schedules(next_execution_at, is_active);
CREATE INDEX idx_delivery_log_status ON notification_delivery_log(delivery_status, delivery_timestamp);
CREATE INDEX idx_delivery_log_user ON notification_delivery_log(user_id, delivery_method, delivery_status);

-- RLS Policies

-- Notification Analytics
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification analytics" 
ON notification_analytics FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification analytics" 
ON notification_analytics FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

CREATE POLICY "System can insert analytics" 
ON notification_analytics FOR INSERT 
WITH CHECK (true);

-- Notification Schedules
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification schedules" 
ON notification_schedules FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

-- Admin Notification Triggers
ALTER TABLE admin_notification_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification triggers" 
ON admin_notification_triggers FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Notification Delivery Log
ALTER TABLE notification_delivery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery logs" 
ON notification_delivery_log FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all delivery logs" 
ON notification_delivery_log FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

CREATE POLICY "System can manage delivery logs" 
ON notification_delivery_log FOR ALL 
WITH CHECK (true);

-- User Notification Settings
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings" 
ON user_notification_settings FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notification settings" 
ON user_notification_settings FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert admin notification templates
INSERT INTO notification_templates (code, title, message_template, category, priority, variables, is_active) VALUES
-- Admin Assignment Notifications
('admin_assignments_pending', 'Assignments Awaiting Review', '{{pending_count}} assignments are waiting for your review. Students are eager for feedback!', 'admin', 'high', '["pending_count"]', true),
('admin_weekly_summary', 'Weekly Admin Summary', 'This week: {{new_users}} new users, {{completed_assignments}} assignments completed, {{pending_reviews}} pending reviews.', 'admin', 'medium', '["new_users", "completed_assignments", "pending_reviews"]', true),
('admin_user_milestone', 'User Achievement Alert', '{{user_name}} just completed {{milestone_type}}! They have earned {{total_points}} total points.', 'admin', 'medium', '["user_name", "milestone_type", "total_points"]', true),
('admin_system_alert', 'System Alert', '{{alert_type}}: {{message}}. Immediate attention may be required.', 'admin', 'critical', '["alert_type", "message"]', true),

-- Institute Admin Notifications  
('institute_student_inactive', 'Student Inactive Alert', 'Student {{student_name}} in {{institute_name}} has been inactive for {{days_inactive}} days.', 'institute', 'medium', '["student_name", "institute_name", "days_inactive"]', true),
('institute_batch_progress', 'Batch Progress Update', 'Batch {{batch_name}} progress: {{completion_percentage}}% complete. {{active_students}} active students.', 'institute', 'low', '["batch_name", "completion_percentage", "active_students"]', true),

-- Recruiter Notifications
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

-- Create function to track notification analytics
CREATE OR REPLACE FUNCTION track_notification_event(
  notification_id UUID,
  user_id UUID,
  event_type TEXT,
  metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analytics_id UUID;
BEGIN
  INSERT INTO notification_analytics (
    notification_id,
    user_id,
    event_type,
    metadata
  ) VALUES (
    notification_id,
    user_id,
    event_type,
    metadata
  ) RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$;

-- Create function to get notification analytics summary
CREATE OR REPLACE FUNCTION get_notification_analytics_summary(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_sent BIGINT,
  total_opened BIGINT,
  total_clicked BIGINT,
  open_rate DECIMAL,
  click_rate DECIMAL,
  top_categories JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE event_type = 'sent') as sent_count,
      COUNT(*) FILTER (WHERE event_type = 'opened') as opened_count,
      COUNT(*) FILTER (WHERE event_type = 'clicked') as clicked_count
    FROM notification_analytics na
    JOIN notifications n ON na.notification_id = n.id
    WHERE na.event_timestamp::date BETWEEN start_date AND end_date
  ),
  category_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'category', n.category,
        'count', COUNT(*)
      )
    ) as categories
    FROM notification_analytics na
    JOIN notifications n ON na.notification_id = n.id
    WHERE na.event_timestamp::date BETWEEN start_date AND end_date
    AND na.event_type = 'sent'
    GROUP BY n.category
    ORDER BY COUNT(*) DESC
    LIMIT 5
  )
  SELECT 
    s.sent_count,
    s.opened_count,
    s.clicked_count,
    CASE WHEN s.sent_count > 0 THEN (s.opened_count::decimal / s.sent_count * 100) ELSE 0 END as open_rate,
    CASE WHEN s.opened_count > 0 THEN (s.clicked_count::decimal / s.opened_count * 100) ELSE 0 END as click_rate,
    COALESCE(cs.categories, '[]'::jsonb) as top_categories
  FROM stats s, category_stats cs;
END;
$$;

-- Create function for smart notification scheduling
CREATE OR REPLACE FUNCTION create_smart_notification(
  target_user_id UUID,
  template_code TEXT,
  template_vars JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'medium',
  respect_quiet_hours BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
  user_settings RECORD;
  scheduled_for TIMESTAMPTZ;
  current_time_in_tz TIMESTAMPTZ;
BEGIN
  -- Get user notification settings
  SELECT * INTO user_settings 
  FROM user_notification_settings 
  WHERE user_id = target_user_id;
  
  -- If no settings found, create default
  IF user_settings IS NULL THEN
    INSERT INTO user_notification_settings (user_id) 
    VALUES (target_user_id)
    RETURNING * INTO user_settings;
  END IF;
  
  -- Calculate optimal send time
  scheduled_for := NOW();
  
  IF respect_quiet_hours AND priority != 'critical' THEN
    -- Convert current time to user's timezone
    current_time_in_tz := NOW() AT TIME ZONE user_settings.timezone;
    
    -- Check if we're in quiet hours
    IF current_time_in_tz::time BETWEEN user_settings.quiet_hours_start AND user_settings.quiet_hours_end THEN
      -- Schedule for end of quiet hours
      scheduled_for := (current_time_in_tz::date + user_settings.quiet_hours_end) AT TIME ZONE user_settings.timezone;
      
      -- If that's in the past, schedule for tomorrow
      IF scheduled_for < NOW() THEN
        scheduled_for := scheduled_for + INTERVAL '1 day';
      END IF;
    END IF;
    
    -- Check weekend preferences
    IF NOT user_settings.weekend_notifications AND EXTRACT(dow FROM scheduled_for) IN (0, 6) THEN
      -- Schedule for next Monday
      scheduled_for := scheduled_for + INTERVAL '1 day' * (8 - EXTRACT(dow FROM scheduled_for));
    END IF;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    template_code,
    template_variables,
    priority,
    scheduled_for,
    category,
    title,
    message
  )
  SELECT 
    target_user_id,
    template_code,
    template_vars,
    priority,
    scheduled_for,
    nt.category,
    nt.title,
    nt.message_template
  FROM notification_templates nt
  WHERE nt.code = template_code
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;