-- Update the profile ownership validation function to allow admin access
CREATE OR REPLACE FUNCTION public.validate_profile_ownership_strict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
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