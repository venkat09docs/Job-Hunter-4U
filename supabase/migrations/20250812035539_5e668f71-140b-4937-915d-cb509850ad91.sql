-- Fix remaining function search path issues from the linter

-- Update the functions that don't have proper search_path set
CREATE OR REPLACE FUNCTION public.is_reasonable_profile_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- For now, return true but this can be enhanced with rate limiting logic
  -- In production, you might want to implement IP-based rate limiting
  -- or require authentication for bulk access
  SELECT TRUE;
$$;

CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log public profile access for security monitoring
  INSERT INTO public.audit_log (
    table_name, 
    action, 
    user_id, 
    timestamp
  )
  VALUES (
    'public_profiles_access', 
    'SELECT', 
    auth.uid(), 
    NOW()
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NULL;
EXCEPTION
  WHEN undefined_table THEN
    -- If audit_log table doesn't exist, continue without logging
    RETURN NULL;
END;
$$;

-- Also fix any remaining functions that might not have search_path set
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;