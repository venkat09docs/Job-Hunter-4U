-- Fix the validate_profile_ownership_strict function to allow profile creation during signup
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
  
  -- Check if this is being called from a signup trigger (no auth context yet)
  -- During signup, the trigger runs before the user is authenticated in the session
  IF TG_OP = 'INSERT' AND auth.uid() IS NULL THEN
    -- Allow profile creation during signup process
    -- The signup triggers handle the user_id validation
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
  
  -- For authenticated operations, ensure user_id matches authenticated user
  IF auth.uid() IS NOT NULL THEN
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create or modify profile for another user';
    END IF;
  ELSE
    -- If no auth context and not an INSERT operation, require authentication
    IF TG_OP != 'INSERT' THEN
      RAISE EXCEPTION 'Authentication required for profile operations';
    END IF;
  END IF;
  
  -- For UPDATE operations, prevent users from changing user_id
  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot change profile user_id';
  END IF;
  
  RETURN NEW;
END;
$function$;