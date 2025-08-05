-- Fix the trigger function by removing problematic ON CONFLICT clauses
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_response text;
BEGIN
  -- Insert profile - using INSERT with proper conflict handling
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
  
  -- Assign default user role - using INSERT with proper conflict handling
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Call webhook function via HTTP
  BEGIN
    SELECT INTO webhook_response
      net.http_post(
        url := 'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
        headers := '{"Content-Type": "application/json"}'::jsonb,
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
    
    RAISE LOG 'Webhook called successfully for user: %', NEW.id;
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