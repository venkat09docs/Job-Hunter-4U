-- Phase 1D: Create smart notification function with fixed syntax
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
  key_name text;
  key_value text;
BEGIN
  -- Get template
  SELECT * INTO template_record 
  FROM notification_templates 
  WHERE template_key = template_key_param AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', template_key_param;
  END IF;
  
  -- Get user name
  SELECT COALESCE(full_name, username, email) INTO user_name 
  FROM profiles WHERE user_id = user_id_param;
  
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
  FOR key_name IN SELECT jsonb_object_keys(template_vars)
  LOOP
    key_value := template_vars ->> key_name;
    final_title := replace(final_title, '{{' || key_name || '}}', COALESCE(key_value, ''));
    final_message := replace(final_message, '{{' || key_name || '}}', COALESCE(key_value, ''));
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
    -- Call email sending via HTTP (will be handled by edge function)
    PERFORM net.http_post(
      url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/send-smart-notification-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3MTUzOCwiZXhwIjoyMDY5MTQ3NTM4fQ.d-rBm6zzLV4zPB4y4RsT8Z7fVuC4X3V91cXTJg58xZQ"}'::jsonb,
      body := json_build_object(
        'notification_id', notification_id,
        'user_id', user_id_param,
        'template_key', template_key_param,
        'template_vars', template_vars
      )::jsonb
    );
  END IF;
  
  RETURN notification_id;
END;
$$;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notification_delivery_log;