-- Create trigger to automatically create profiles when users sign up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_with_webhook();

-- Update the sync function to handle duplicate usernames better
CREATE OR REPLACE FUNCTION public.sync_missing_user_profiles()
RETURNS TABLE(synced_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    -- Generate base username
    base_username := COALESCE(
      current_user_record.raw_user_meta_data ->> 'username',
      split_part(current_user_record.email, '@', 1)
    );
    
    -- Remove any non-alphanumeric characters and make lowercase
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

    -- Insert the profile with unique username
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
$$;