-- Phase 3: Essential Functions for Admin Notifications & Analytics

-- Create analytics tables (simple version)
CREATE TABLE IF NOT EXISTS notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'dismissed')),
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notification_analytics_user_event ON notification_analytics(user_id, event_type, event_timestamp);

-- Enable RLS
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "System can insert analytics" ON notification_analytics;
CREATE POLICY "System can insert analytics" 
ON notification_analytics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view analytics" ON notification_analytics;
CREATE POLICY "Admins can view analytics" 
ON notification_analytics FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage triggers" ON admin_notification_triggers;
CREATE POLICY "Admins can manage triggers" 
ON admin_notification_triggers FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can manage settings" ON user_notification_settings;
CREATE POLICY "Users can manage settings" 
ON user_notification_settings FOR ALL 
USING (user_id = auth.uid());

-- Create function to track notification events
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
  click_rate DECIMAL
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
    WHERE na.event_timestamp::date BETWEEN start_date AND end_date
  )
  SELECT 
    s.sent_count,
    s.opened_count,
    s.clicked_count,
    CASE WHEN s.sent_count > 0 THEN (s.opened_count::decimal / s.sent_count * 100) ELSE 0 END as open_rate,
    CASE WHEN s.opened_count > 0 THEN (s.clicked_count::decimal / s.opened_count * 100) ELSE 0 END as click_rate
  FROM stats s;
END;
$$;

-- Create function to send admin notifications
CREATE OR REPLACE FUNCTION send_admin_notification(
  notification_title TEXT,
  notification_message TEXT,
  target_roles TEXT[] DEFAULT '{"admin"}',
  priority TEXT DEFAULT 'medium',
  notification_category TEXT DEFAULT 'admin'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_count INTEGER := 0;
  target_user RECORD;
BEGIN
  -- Insert notifications for users with specified roles
  FOR target_user IN 
    SELECT DISTINCT ur.user_id, p.full_name
    FROM user_roles ur
    JOIN profiles p ON ur.user_id = p.user_id
    WHERE ur.role::text = ANY(target_roles)
  LOOP
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      category,
      priority,
      is_read
    ) VALUES (
      target_user.user_id,
      notification_title,
      notification_message,
      'admin_alert',
      notification_category,
      priority,
      false
    );
    
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$;