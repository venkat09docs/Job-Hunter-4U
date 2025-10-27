-- Fix phone_number extraction in webhook functions

-- Update handle_new_user_with_webhook to properly extract phone_number
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Extract clean username from metadata
  DECLARE
    clean_username text;
    final_username text;
    username_counter integer := 1;
  BEGIN
    -- Get base username from metadata
    clean_username := COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      NEW.raw_user_meta_data ->> 'full_name', 
      NEW.raw_user_meta_data ->> 'Display Name', 
      split_part(NEW.email, '@', 1)
    );
    
    -- Clean username: remove non-alphanumeric chars and make lowercase
    clean_username := lower(regexp_replace(clean_username, '[^a-zA-Z0-9]', '', 'g'));
    IF clean_username = '' OR clean_username IS NULL THEN
      clean_username := 'user';
    END IF;
    
    -- Find unique username (simple counter approach, not timestamp+random)
    final_username := clean_username;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
      final_username := clean_username || username_counter::text;
      username_counter := username_counter + 1;
    END LOOP;
    
    -- Insert profile with clean username
    INSERT INTO public.profiles (user_id, full_name, username, email, industry, phone_number)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
      final_username,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT'),
      COALESCE(NEW.raw_user_meta_data ->> 'phone_number', '')
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      username = EXCLUDED.username,
      email = EXCLUDED.email,
      industry = EXCLUDED.industry,
      phone_number = EXCLUDED.phone_number,
      updated_at = now();
  END;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Add webhook to queue with phone_number from raw_user_meta_data
  INSERT INTO public.webhook_queue (
    user_id,
    webhook_url,
    user_data,
    status
  ) VALUES (
    NEW.id,
    'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
      'username', final_username,
      'industry', COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT'),
      'phone_number', COALESCE(NEW.raw_user_meta_data ->> 'phone_number', ''),
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at,
      'email_verified', CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
      'app_metadata', NEW.raw_app_meta_data,
      'user_metadata', NEW.raw_user_meta_data,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'provider', COALESCE(NEW.raw_app_meta_data ->> 'provider', 'email'),
      'providers', COALESCE(NEW.raw_app_meta_data -> 'providers', '["email"]'::jsonb),
      'last_sign_in_at', NEW.last_sign_in_at,
      'confirmed_at', COALESCE(NEW.confirmed_at, NEW.email_confirmed_at),
      'role', 'authenticated',
      'signup_source', 'web_application',
      'timestamp', now()
    ),
    'pending'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user_with_webhook for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;