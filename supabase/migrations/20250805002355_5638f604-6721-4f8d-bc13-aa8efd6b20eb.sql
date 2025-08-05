-- Fix the trigger function to remove references to non-existent fields
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log that the trigger was fired
  RAISE LOG 'TRIGGER FIRED: New user created with ID: %', NEW.id;
  
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
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Try webhook call with only fields that exist in auth.users
  BEGIN
    PERFORM net.http_post(
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
        'phone', NEW.phone,
        'confirmed_at', NEW.confirmed_at,
        'email_verified', CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        'provider', 'email',
        'role', 'authenticated',
        'signup_source', 'web_application',
        'timestamp', now()
      )::jsonb
    );
    
    RAISE LOG 'Webhook called successfully for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Webhook call failed: %', SQLERRM;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user_with_webhook: %', SQLERRM;
    RETURN NEW;
END;
$$;