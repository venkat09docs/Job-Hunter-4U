-- Create a secure function to clean up ugly usernames
CREATE OR REPLACE FUNCTION public.cleanup_ugly_usernames()
RETURNS TABLE(cleaned_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_record RECORD;
  clean_username TEXT;
  final_username TEXT;
  username_counter INTEGER;
  ugly_pattern TEXT := '_[0-9]{13}_[a-z0-9]{6}$';
  cleaned_profiles_count INTEGER := 0;
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
    
    cleaned_profiles_count := cleaned_profiles_count + 1;
    
    RAISE NOTICE 'Updated username for user %: % -> %', 
      profile_record.user_id, profile_record.username, final_username;
  END LOOP;
  
  RETURN QUERY SELECT cleaned_profiles_count, 
    'Successfully cleaned ' || cleaned_profiles_count || ' ugly usernames' as message;
END;
$function$;

-- Execute the cleanup function
SELECT * FROM public.cleanup_ugly_usernames();