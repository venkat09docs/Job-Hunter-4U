-- Phase 1: Enhanced Notification System Foundation

-- Enhance notifications table with better categorization and email support
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_url text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key text NOT NULL UNIQUE,
  title_template text NOT NULL,
  message_template text NOT NULL,
  email_subject_template text,
  email_body_template text,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create notification delivery log for tracking
CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  delivery_type text NOT NULL, -- 'app', 'email'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  error_message text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enhanced notification preferences with email support
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS email_enabled boolean DEFAULT true;
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS email_frequency text DEFAULT 'immediate'; -- 'immediate', 'daily', 'weekly', 'never'
ALTER TABLE public.notification_preferences ADD COLUMN IF NOT EXISTS app_enabled boolean DEFAULT true;

-- Insert core notification templates
INSERT INTO public.notification_templates (template_key, title_template, message_template, email_subject_template, email_body_template, category) VALUES
('job_application_reminder', 'Job Application Reminder', 'It''s been a while since your last job application. Keep up the momentum!', 'Time to Apply for New Opportunities', 'Hi {{user_name}}, it''s been a while since your last job application. Keep up the momentum and apply to new opportunities today!', 'job_hunting'),
('new_job_posted', 'New Job Posted', 'A new job opportunity "{{job_title}}" at {{company}} has been posted!', 'New Job Opportunity: {{job_title}}', 'Hi {{user_name}}, a new job opportunity "{{job_title}}" at {{company}} has been posted that matches your profile!', 'job_hunting'),
('assignment_due_soon', 'Assignment Due Soon', 'Your assignment "{{assignment_title}}" is due in {{days}} days', 'Assignment Reminder: {{assignment_title}}', 'Hi {{user_name}}, your assignment "{{assignment_title}}" is due in {{days}} days. Don''t forget to submit it on time!', 'assignments'),
('assignment_completed', 'Assignment Completed', 'Congratulations! You''ve completed "{{assignment_title}}" and earned {{points}} points', 'Assignment Completed Successfully', 'Congratulations {{user_name}}! You''ve successfully completed "{{assignment_title}}" and earned {{points}} points.', 'assignments'),
('subscription_expiring', 'Subscription Expiring Soon', 'Your {{plan_name}} subscription expires in {{days}} days', 'Subscription Renewal Reminder', 'Hi {{user_name}}, your {{plan_name}} subscription expires in {{days}} days. Renew now to continue enjoying all features.', 'subscription'),
('points_milestone', 'Points Milestone Achieved', 'Congratulations! You''ve reached {{points}} points', 'You''ve Reached a New Milestone!', 'Congratulations {{user_name}}! You''ve reached {{points}} points. Keep up the great work!', 'achievements'),
('follow_up_reminder', 'Follow-up Reminder', 'Time to follow up on your application for {{job_title}} at {{company}}', 'Follow-up Time: {{job_title}}', 'Hi {{user_name}}, it''s time to follow up on your application for {{job_title}} at {{company}}. A timely follow-up can make all the difference!', 'job_hunting'),
('github_streak_achieved', 'GitHub Streak Achieved', 'Amazing! You''ve maintained a {{days}} day GitHub commit streak', 'GitHub Streak: {{days}} Days!', 'Amazing work {{user_name}}! You''ve maintained a {{days}} day GitHub commit streak. Keep coding!', 'technical'),
('linkedin_milestone', 'LinkedIn Network Milestone', 'Great job! You now have {{connections}} LinkedIn connections', 'LinkedIn Network Growing: {{connections}} Connections', 'Great networking {{user_name}}! You now have {{connections}} LinkedIn connections. Your professional network is growing!', 'networking'),
('profile_completion_reminder', 'Complete Your Profile', 'Your profile is only {{percentage}}% complete. Complete it to improve your job search success!', 'Complete Your Profile for Better Opportunities', 'Hi {{user_name}}, your profile is only {{percentage}}% complete. Complete it to improve your job search success and attract more opportunities!', 'profile')
ON CONFLICT (template_key) DO NOTHING;

-- Create function to send email notifications
CREATE OR REPLACE FUNCTION public.queue_email_notification(
  notification_id_param uuid,
  user_id_param uuid,
  template_key_param text,
  template_vars jsonb DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  template_record record;
  user_email text;
  user_name text;
  final_subject text;
  final_body text;
BEGIN
  -- Get template
  SELECT * INTO template_record 
  FROM notification_templates 
  WHERE template_key = template_key_param AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE WARNING 'Template not found: %', template_key_param;
    RETURN;
  END IF;
  
  -- Get user details
  SELECT email INTO user_email FROM profiles WHERE user_id = user_id_param;
  SELECT COALESCE(full_name, username, email) INTO user_name FROM profiles WHERE user_id = user_id_param;
  
  IF user_email IS NULL THEN
    RAISE WARNING 'User email not found for user: %', user_id_param;
    RETURN;
  END IF;
  
  -- Replace template variables
  final_subject := template_record.email_subject_template;
  final_body := template_record.email_body_template;
  
  -- Replace {{user_name}}
  final_subject := replace(final_subject, '{{user_name}}', COALESCE(user_name, 'there'));
  final_body := replace(final_body, '{{user_name}}', COALESCE(user_name, 'there'));
  
  -- Replace other variables from template_vars
  FOR key IN SELECT jsonb_object_keys(template_vars)
  LOOP
    final_subject := replace(final_subject, '{{' || key || '}}', template_vars ->> key);
    final_body := replace(final_body, '{{' || key || '}}', template_vars ->> key);
  END LOOP;
  
  -- Log delivery attempt
  INSERT INTO notification_delivery_log (notification_id, delivery_type, status)
  VALUES (notification_id_param, 'email', 'pending');
  
  -- Call email sending function (will be created next)
  PERFORM net.http_post(
    url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/send-notification-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3MTUzOCwiZXhwIjoyMDY5MTQ3NTM4fQ.d-rBm6zzLV4zPB4y4RsT8Z7fVuC4X3V91cXTJg58xZQ"}'::jsonb,
    body := json_build_object(
      'to', user_email,
      'subject', final_subject,
      'html', final_body,
      'notification_id', notification_id_param
    )::jsonb
  );
  
END;
$$;

-- Function to create smart notifications
CREATE OR REPLACE FUNCTION public.create_smart_notification(
  user_id_param uuid,
  template_key_param text,
  template_vars jsonb DEFAULT '{}',
  action_url_param text DEFAULT NULL,
  scheduled_for_param timestamp with time zone DEFAULT NULL,
  priority_param text DEFAULT 'normal'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  template_record record;
  notification_id uuid;
  final_title text;
  final_message text;
  user_name text;
  should_send_email boolean := false;
  should_send_app boolean := true;
BEGIN
  -- Get template
  SELECT * INTO template_record 
  FROM notification_templates 
  WHERE template_key = template_key_param AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', template_key_param;
  END IF;
  
  -- Get user name
  SELECT COALESCE(full_name, username, email) INTO user_name FROM profiles WHERE user_id = user_id_param;
  
  -- Check user preferences
  SELECT 
    COALESCE(email_enabled, true) AND should_send_notification(user_id_param, template_key_param),
    COALESCE(app_enabled, true) AND should_send_notification(user_id_param, template_key_param)
  INTO should_send_email, should_send_app
  FROM notification_preferences 
  WHERE user_id = user_id_param AND notification_type = template_key_param;
  
  -- If no preferences found, use defaults
  IF NOT FOUND THEN
    should_send_email := should_send_notification(user_id_param, template_key_param);
    should_send_app := should_send_notification(user_id_param, template_key_param);
  END IF;
  
  -- Skip if user doesn't want any notifications
  IF NOT should_send_app AND NOT should_send_email THEN
    RETURN NULL;
  END IF;
  
  -- Replace template variables
  final_title := template_record.title_template;
  final_message := template_record.message_template;
  
  -- Replace {{user_name}}
  final_title := replace(final_title, '{{user_name}}', COALESCE(user_name, 'there'));
  final_message := replace(final_message, '{{user_name}}', COALESCE(user_name, 'there'));
  
  -- Replace other variables from template_vars
  FOR key IN SELECT jsonb_object_keys(template_vars)
  LOOP
    final_title := replace(final_title, '{{' || key || '}}', template_vars ->> key);
    final_message := replace(final_message, '{{' || key || '}}', template_vars ->> key);
  END LOOP;
  
  -- Create notification if app notifications enabled
  IF should_send_app THEN
    INSERT INTO notifications (
      user_id, title, message, type, category, priority, 
      action_url, scheduled_for, related_id, is_read
    ) VALUES (
      user_id_param, final_title, final_message, template_key_param, 
      template_record.category, priority_param, action_url_param, 
      scheduled_for_param, (template_vars ->> 'related_id'), false
    ) RETURNING id INTO notification_id;
  END IF;
  
  -- Queue email if enabled and notification was created
  IF should_send_email AND notification_id IS NOT NULL THEN
    PERFORM queue_email_notification(notification_id, user_id_param, template_key_param, template_vars);
  END IF;
  
  RETURN notification_id;
END;
$$;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_delivery_log;