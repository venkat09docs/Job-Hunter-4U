-- Clean up existing ugly usernames with timestamp and random suffixes

DO $$
DECLARE
  profile_record RECORD;
  clean_username TEXT;
  final_username TEXT;
  username_counter INTEGER;
  ugly_pattern TEXT := '_[0-9]{13}_[a-z0-9]{6}$';
BEGIN
  -- Process each profile with ugly username pattern
  FOR profile_record IN 
    SELECT user_id, username, full_name, email 
    FROM public.profiles 
    WHERE username ~ ugly_pattern
  LOOP
    -- Extract clean username by removing the timestamp and random suffix
    clean_username := regexp_replace(profile_record.username, ugly_pattern, '');
    
    -- Ensure clean_username is not empty
    IF clean_username = '' OR clean_username IS NULL THEN
      clean_username := COALESCE(
        lower(regexp_replace(profile_record.full_name, '[^a-zA-Z0-9]', '', 'g')),
        split_part(profile_record.email, '@', 1),
        'user'
      );
    END IF;
    
    -- Find a unique clean username
    final_username := clean_username;
    username_counter := 1;
    
    -- Keep trying until we find a unique username
    WHILE EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE username = final_username 
      AND user_id != profile_record.user_id
    ) LOOP
      final_username := clean_username || username_counter::text;
      username_counter := username_counter + 1;
    END LOOP;
    
    -- Update the profile with clean username
    UPDATE public.profiles 
    SET 
      username = final_username,
      updated_at = now()
    WHERE user_id = profile_record.user_id;
    
    RAISE NOTICE 'Updated username for user %: % -> %', 
      profile_record.user_id, profile_record.username, final_username;
  END LOOP;
END $$;