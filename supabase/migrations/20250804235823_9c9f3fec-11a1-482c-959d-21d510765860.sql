-- Create the trigger on auth.users that calls the webhook
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_response text;
BEGIN
  -- First, insert profile and user role as before
  INSERT INTO public.profiles (user_id, full_name, username, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1)),
    NEW.email
  ) ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user') ON CONFLICT (user_id) DO NOTHING;
  
  -- Call webhook function via HTTP
  BEGIN
    SELECT INTO webhook_response
      net.http_post(
        url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
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
          'app_metadata', NEW.app_metadata,
          'user_metadata', NEW.user_metadata,
          'phone', NEW.phone,
          'confirmed_at', NEW.confirmed_at
        )::jsonb
      );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Webhook call failed: %', SQLERRM;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user_with_webhook: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_webhook();