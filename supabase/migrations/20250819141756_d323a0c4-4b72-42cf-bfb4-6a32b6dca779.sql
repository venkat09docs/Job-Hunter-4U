-- Temporarily modify the trigger to allow service role operations
CREATE OR REPLACE FUNCTION public.validate_profile_ownership_strict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service role operations without authentication check
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Ensure user_id matches authenticated user (except for service role)
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
$$;

-- Now create missing profiles using the service function
SELECT public.sync_missing_user_profiles();