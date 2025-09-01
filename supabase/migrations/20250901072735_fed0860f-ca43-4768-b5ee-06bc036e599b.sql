-- Drop all versions of create_smart_notification function to resolve conflicts
DROP FUNCTION IF EXISTS public.create_smart_notification CASCADE;

-- Recreate the function with a clear, unambiguous signature
CREATE OR REPLACE FUNCTION public.create_smart_notification(
  user_id_param uuid, 
  template_key_param text, 
  template_vars jsonb DEFAULT '{}'::jsonb, 
  action_url_param text DEFAULT NULL, 
  priority_param text DEFAULT 'normal', 
  scheduled_for_param timestamp with time zone DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  related_id_value uuid := NULL;
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
  
  -- Safely handle related_id conversion to UUID
  BEGIN
    IF template_vars ? 'related_id' AND template_vars ->> 'related_id' IS NOT NULL AND template_vars ->> 'related_id' != '' THEN
      related_id_value := (template_vars ->> 'related_id')::uuid;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      -- If the related_id is not a valid UUID, set it to NULL
      related_id_value := NULL;
  END;
  
  -- Create notification if app notifications enabled
  IF should_send_app THEN
    INSERT INTO notifications (
      user_id, title, message, type, category, priority, 
      action_url, scheduled_for, related_id, is_read
    ) VALUES (
      user_id_param, final_title, final_message, template_key_param, 
      template_record.category, priority_param, action_url_param, 
      scheduled_for_param, related_id_value, false
    ) RETURNING id INTO notification_id;
  END IF;
  
  RETURN notification_id;
END;
$function$;