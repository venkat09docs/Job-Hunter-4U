-- Update the trigger function with better error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  webhook_response uuid;
  error_message text;
BEGIN
  -- Use NOTICE instead of LOG for better visibility
  RAISE NOTICE 'TRIGGER FIRED: New user created with ID: %', NEW.id;
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, username, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    updated_at = now();
  
  RAISE NOTICE 'Profile created for user: %', NEW.id;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'User role assigned for user: %', NEW.id;
  
  -- Try webhook call with detailed error handling
  BEGIN
    RAISE NOTICE 'About to call webhook for user: %', NEW.id;
    
    -- Check if net extension is available
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
      RAISE WARNING 'pg_net extension not found for user %', NEW.id;
      RETURN NEW;
    END IF;
    
    SELECT net.http_post(
      url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vaXJyeXZhanp5cmlhZ3FpaGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NzE1MzgsImV4cCI6MjA2OTE0NzUzOH0.fyoyxE5pv42Vemp3iA1HmGkzJIA3SAtByXyf5FmYxOw"}'::jsonb,
      body := json_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'full_name', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
        'username', COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
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
    ) INTO webhook_response;
    
    RAISE NOTICE 'Webhook called successfully for user: %, response: %', NEW.id, webhook_response;
    
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
      RAISE WARNING 'Webhook call failed for user %: % (SQLSTATE: %)', NEW.id, error_message, SQLSTATE;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
    RAISE WARNING 'Error in handle_new_user_with_webhook for user %: % (SQLSTATE: %)', NEW.id, error_message, SQLSTATE;
    RETURN NEW;
END;
$$;