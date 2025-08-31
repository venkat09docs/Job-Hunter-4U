-- Fix the handle_new_user_with_webhook function to properly queue webhooks
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
    INSERT INTO public.profiles (user_id, full_name, username, email, industry)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
      final_username,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT')
    )
    ON CONFLICT (user_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      username = EXCLUDED.username,
      email = EXCLUDED.email,
      industry = EXCLUDED.industry,
      updated_at = now();
  END;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- **NEW: Add webhook to queue for Funnels Hub Pro**
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
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at,
      'email_verified', CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
      'phone', NEW.phone,
      'app_metadata', NEW.app_metadata,
      'user_metadata', NEW.user_metadata,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'provider', COALESCE(NEW.app_metadata ->> 'provider', 'email'),
      'providers', COALESCE(NEW.app_metadata -> 'providers', '["email"]'::jsonb),
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

-- Create a function to manually queue missed webhooks for recent signups
CREATE OR REPLACE FUNCTION public.queue_missed_webhooks()
RETURNS TABLE(queued_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  queued_users integer := 0;
  user_record record;
BEGIN
  -- Find users created since Aug 18, 2025 who don't have webhook entries
  FOR user_record IN
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.updated_at,
      au.email_confirmed_at,
      au.phone,
      au.app_metadata,
      au.user_metadata,
      au.raw_user_meta_data,
      au.last_sign_in_at,
      au.confirmed_at,
      p.full_name,
      p.username
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE au.created_at >= '2025-08-18'::timestamptz
    AND NOT EXISTS (
      SELECT 1 FROM public.webhook_queue wq 
      WHERE wq.user_id = au.id
    )
  LOOP
    -- Add missed webhook to queue
    INSERT INTO public.webhook_queue (
      user_id,
      webhook_url,
      user_data,
      status
    ) VALUES (
      user_record.id,
      'https://moirryvajzyriagqihbe.supabase.co/functions/v1/user-signup-webhook',
      jsonb_build_object(
        'user_id', user_record.id,
        'email', user_record.email,
        'full_name', COALESCE(user_record.full_name, user_record.raw_user_meta_data ->> 'full_name', user_record.raw_user_meta_data ->> 'Display Name', user_record.email),
        'username', COALESCE(user_record.username, user_record.raw_user_meta_data ->> 'username', split_part(user_record.email, '@', 1)),
        'industry', COALESCE(user_record.raw_user_meta_data ->> 'industry', 'IT'),
        'created_at', user_record.created_at,
        'updated_at', user_record.updated_at,
        'email_verified', CASE WHEN user_record.email_confirmed_at IS NOT NULL THEN true ELSE false END,
        'phone', user_record.phone,
        'app_metadata', user_record.app_metadata,
        'user_metadata', user_record.user_metadata,
        'raw_user_meta_data', user_record.raw_user_meta_data,
        'provider', COALESCE(user_record.app_metadata ->> 'provider', 'email'),
        'providers', COALESCE(user_record.app_metadata -> 'providers', '["email"]'::jsonb),
        'last_sign_in_at', user_record.last_sign_in_at,
        'confirmed_at', COALESCE(user_record.confirmed_at, user_record.email_confirmed_at),
        'role', 'authenticated',
        'signup_source', 'web_application',
        'timestamp', now()
      ),
      'pending'
    );
    
    queued_users := queued_users + 1;
  END LOOP;

  RETURN QUERY SELECT queued_users, 'Successfully queued ' || queued_users || ' missed webhooks for processing';
END;
$$;