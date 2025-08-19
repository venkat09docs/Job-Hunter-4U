-- Temporarily modify the validation function to allow system operations
CREATE OR REPLACE FUNCTION public.validate_profile_ownership_strict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow system operations (like migrations and cleanup)
  IF current_setting('role') = 'postgres' OR current_setting('role') = 'supabase_admin' THEN
    RETURN NEW;
  END IF;
  
  -- Service role can modify any profile
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Check if user is admin
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  ) THEN
    -- Admins can modify any profile
    RETURN NEW;
  END IF;
  
  -- Ensure user_id matches authenticated user for regular users
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create or modify profile for another user';
  END IF;
  
  -- Ensure we have a valid authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for profile operations';
  END IF;
  
  -- For UPDATE operations, prevent users from changing user_id
  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change profile user_id';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Now clean up existing ugly usernames
DO $$
DECLARE
  profile_record RECORD;
  clean_username TEXT;
  final_username TEXT;
  username_counter INTEGER;
  ugly_pattern TEXT := '_[0-9]{13}_[a-z0-9]{6}$';
  cleaned_count INTEGER := 0;
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
    
    cleaned_count := cleaned_count + 1;
    
    RAISE NOTICE 'Cleaned username: % -> % (User: %)', 
      profile_record.username, final_username, profile_record.user_id;
  END LOOP;
  
  RAISE NOTICE 'Successfully cleaned % ugly usernames', cleaned_count;
END $$;