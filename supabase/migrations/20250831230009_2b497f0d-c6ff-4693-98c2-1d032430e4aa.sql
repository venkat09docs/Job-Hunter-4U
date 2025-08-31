-- Update RLS policies for notification management - allow recruiters to manage triggers and templates

-- Drop existing policy that only allows admins
DROP POLICY "Admins can manage triggers" ON admin_notification_triggers;

-- Create new policy allowing both admins and recruiters
CREATE POLICY "Admins and recruiters can manage triggers" 
ON admin_notification_triggers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

-- Create notification templates table for email and in-app notifications
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type TEXT NOT NULL CHECK (template_type IN ('email', 'in_app')),
  template_code TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  subject TEXT, -- For email templates
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of template variables like {{user_name}}
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notification templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification templates
CREATE POLICY "Admins and recruiters can manage templates" 
ON notification_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

CREATE POLICY "Everyone can view active templates" 
ON notification_templates 
FOR SELECT 
USING (is_active = true);

-- Create notification schedules table for managing when notifications are sent
CREATE TABLE IF NOT EXISTS notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_name TEXT NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
  cron_expression TEXT, -- For custom schedules
  target_roles TEXT[] DEFAULT ARRAY['user'],
  notification_template_id UUID REFERENCES notification_templates(id),
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ
);

-- Enable RLS on notification schedules
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification schedules
CREATE POLICY "Admins and recruiters can manage schedules" 
ON notification_schedules 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

-- Create trigger for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_notification_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE OR REPLACE FUNCTION update_notification_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER trigger_update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_templates_updated_at();

CREATE TRIGGER trigger_update_notification_schedules_updated_at
  BEFORE UPDATE ON notification_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_schedules_updated_at();

-- Insert default notification templates
INSERT INTO notification_templates (template_type, template_code, template_name, subject, content, variables) VALUES
('email', 'welcome_email', 'Welcome Email', 'Welcome to {{app_name}}!', 
 'Hi {{user_name}},\n\nWelcome to {{app_name}}! We''re excited to have you on board.\n\nBest regards,\nThe {{app_name}} Team', 
 '["user_name", "app_name"]'::jsonb),
('email', 'password_reset', 'Password Reset', 'Reset Your Password', 
 'Hi {{user_name}},\n\nClick the link below to reset your password:\n{{reset_link}}\n\nIf you didn''t request this, please ignore this email.\n\nBest regards,\nThe {{app_name}} Team', 
 '["user_name", "reset_link", "app_name"]'::jsonb),
('in_app', 'profile_completion', 'Profile Completion Reminder', NULL, 
 'Complete your profile to unlock more features! You''re {{completion_percentage}}% done.', 
 '["completion_percentage"]'::jsonb),
('in_app', 'new_job_posted', 'New Job Posted', NULL, 
 'A new job "{{job_title}}" at {{company_name}} has been posted!', 
 '["job_title", "company_name"]'::jsonb),
('email', 'job_application_reminder', 'Job Application Reminder', 'Don''t Forget to Apply!', 
 'Hi {{user_name}},\n\nYou viewed the job "{{job_title}}" at {{company_name}} but haven''t applied yet. Don''t miss this opportunity!\n\nApply now: {{job_url}}\n\nBest regards,\nThe {{app_name}} Team', 
 '["user_name", "job_title", "company_name", "job_url", "app_name"]'::jsonb);

-- Insert default notification schedules
INSERT INTO notification_schedules (schedule_name, schedule_type, target_roles, trigger_conditions, is_active) VALUES
('Daily Profile Completion Reminders', 'daily', ARRAY['user'], '{"min_profile_completion": 70}'::jsonb, true),
('Weekly Job Application Summary', 'weekly', ARRAY['user'], '{"day_of_week": "monday"}'::jsonb, true),
('Monthly Engagement Report', 'monthly', ARRAY['user'], '{"day_of_month": 1}'::jsonb, false);