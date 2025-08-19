-- Update user profile creation functions to use full_name for username

-- Update the new user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile with proper data extraction
  INSERT INTO public.profiles (user_id, full_name, username, email, industry)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', split_part(NEW.email, '@', 1)),
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
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Store webhook data in queue for processing (if table exists)
  INSERT INTO public.webhook_queue (user_id, user_data)
  VALUES (
    NEW.id,
    json_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', NEW.email),
      'username', COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'Display Name', split_part(NEW.email, '@', 1)),
      'industry', COALESCE(NEW.raw_user_meta_data ->> 'industry', 'IT'),
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at,
      'email_confirmed_at', NEW.email_confirmed_at,
      'last_sign_in_at', NEW.last_sign_in_at,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'phone', NEW.phone,
      'confirmed_at', NEW.confirmed_at,
      'email_verified', CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    user_data = EXCLUDED.user_data,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN undefined_table THEN
    -- If webhook_queue table doesn't exist, continue without it
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user_with_webhook: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update the sync function for existing users
CREATE OR REPLACE FUNCTION public.sync_missing_user_profiles()
RETURNS TABLE(synced_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  missing_profiles_count integer;
  synced_profiles_count integer := 0;
  current_user_record record;
  base_username text;
  final_username text;
  username_counter integer;
BEGIN
  -- Get count of users missing profiles
  SELECT COUNT(*) INTO missing_profiles_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.user_id
  WHERE p.user_id IS NULL;

  -- If no missing profiles, return early
  IF missing_profiles_count = 0 THEN
    RETURN QUERY SELECT 0 as synced_count, 'All users already have profiles' as message;
    RETURN;
  END IF;

  -- Process each user missing a profile
  FOR current_user_record IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE p.user_id IS NULL
  LOOP
    -- Generate base username using full_name logic (same as name field)
    base_username := COALESCE(
      current_user_record.raw_user_meta_data ->> 'full_name',
      current_user_record.raw_user_meta_data ->> 'Display Name',
      split_part(current_user_record.email, '@', 1)
    );
    
    -- Remove any non-alphanumeric characters and make lowercase for username uniqueness
    base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'));
    
    -- Ensure username is not empty
    IF base_username = '' OR base_username IS NULL THEN
      base_username := 'user';
    END IF;
    
    -- Find a unique username
    final_username := base_username;
    username_counter := 1;
    
    -- Keep trying until we find a unique username
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
      final_username := base_username || username_counter::text;
      username_counter := username_counter + 1;
    END LOOP;

    -- Insert the profile with username based on full_name
    INSERT INTO public.profiles (user_id, full_name, username, email, industry)
    VALUES (
      current_user_record.id,
      COALESCE(
        current_user_record.raw_user_meta_data ->> 'full_name',
        current_user_record.raw_user_meta_data ->> 'Display Name',
        split_part(current_user_record.email, '@', 1)
      ),
      final_username,
      current_user_record.email,
      COALESCE(current_user_record.raw_user_meta_data ->> 'industry', 'IT')
    );

    -- Ensure user has default role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_record.id, 'user'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    synced_profiles_count := synced_profiles_count + 1;
  END LOOP;

  RETURN QUERY SELECT synced_profiles_count, 
    'Successfully synced ' || synced_profiles_count || ' missing profiles' as message;
END;
$function$;