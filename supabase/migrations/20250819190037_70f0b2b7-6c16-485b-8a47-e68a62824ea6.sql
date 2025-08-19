-- Fix username generation to use clean usernames without random suffixes

-- Update the handle_new_user function to use clean usernames
CREATE OR REPLACE FUNCTION public.handle_new_user_with_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user_with_webhook for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update sync_missing_user_profiles function to use clean usernames
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
    -- Generate clean username from metadata (no timestamp/random suffixes)
    base_username := COALESCE(
      current_user_record.raw_user_meta_data ->> 'username',
      current_user_record.raw_user_meta_data ->> 'full_name',
      current_user_record.raw_user_meta_data ->> 'Display Name',
      split_part(current_user_record.email, '@', 1)
    );
    
    -- Clean username: remove non-alphanumeric chars and make lowercase  
    base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'));
    
    -- Ensure username is not empty
    IF base_username = '' OR base_username IS NULL THEN
      base_username := 'user';
    END IF;
    
    -- Find a unique username using simple counter approach
    final_username := base_username;
    username_counter := 1;
    
    -- Keep trying until we find a unique username
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
      final_username := base_username || username_counter::text;
      username_counter := username_counter + 1;
    END LOOP;

    -- Insert the profile with clean username
    INSERT INTO public.profiles (user_id, full_name, username, email, industry)
    VALUES (
      current_user_record.id,
      COALESCE(
        current_user_record.raw_user_meta_data ->> 'full_name',
        current_user_record.raw_user_meta_data ->> 'Display Name',
        split_part(current_user_record.email, '@', 1)
      ),
      final_username,  -- Clean username without random suffixes
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
    'Successfully synced ' || synced_profiles_count || ' profiles with clean usernames' as message;
END;
$function$;