-- Update the handle_new_user function to include industry from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, username, email, industry)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    industry = EXCLUDED.industry,
    updated_at = now();
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Store webhook data in queue for processing
  INSERT INTO public.webhook_queue (user_id, user_data)
  VALUES (
    NEW.id,
    json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
      'username', COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
      'industry', COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT'),
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at,
      'email_confirmed_at', NEW.email_confirmed_at,
      'last_sign_in_at', NEW.last_sign_in_at,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'phone', NEW.phone,
      'confirmed_at', NEW.confirmed_at,
      'email_verified', CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
      'provider', 'email',
      'role', 'authenticated',
      'signup_source', 'web_application',
      'timestamp', now()
    )::jsonb
  );
  
  RETURN NEW;
END;
$function$;