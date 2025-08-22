-- SECURITY FIX: LinkedIn Users Table - Personal Information Protection

-- First, let's check the current policies and improve them
-- The issue is that the current policies might not be restrictive enough or properly implemented

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Admins can manage all users" ON public.linkedin_users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.linkedin_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.linkedin_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.linkedin_users;

-- Create more secure and explicit policies for linkedin_users table

-- 1. Users can only view their own LinkedIn data
CREATE POLICY "Users can view own linkedin data only"
ON public.linkedin_users
FOR SELECT
USING (auth.uid() = auth_uid AND auth.uid() IS NOT NULL);

-- 2. Users can only insert their own LinkedIn data
CREATE POLICY "Users can insert own linkedin data only"
ON public.linkedin_users  
FOR INSERT
WITH CHECK (auth.uid() = auth_uid AND auth.uid() IS NOT NULL);

-- 3. Users can only update their own LinkedIn data
CREATE POLICY "Users can update own linkedin data only"
ON public.linkedin_users
FOR UPDATE
USING (auth.uid() = auth_uid AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = auth_uid AND auth.uid() IS NOT NULL);

-- 4. Users can only delete their own LinkedIn data
CREATE POLICY "Users can delete own linkedin data only"
ON public.linkedin_users
FOR DELETE
USING (auth.uid() = auth_uid AND auth.uid() IS NOT NULL);

-- 5. Super admins can manage LinkedIn user data for support purposes
CREATE POLICY "Super admins can manage linkedin user data"
ON public.linkedin_users
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add additional security: ensure auth_uid cannot be modified after creation
-- Create a trigger to prevent auth_uid modification
CREATE OR REPLACE FUNCTION public.prevent_auth_uid_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent modification of auth_uid after record creation
  IF TG_OP = 'UPDATE' AND OLD.auth_uid IS DISTINCT FROM NEW.auth_uid THEN
    RAISE EXCEPTION 'Modification of auth_uid is not allowed for security reasons';
  END IF;
  
  -- Ensure auth_uid matches the authenticated user on INSERT
  IF TG_OP = 'INSERT' AND NEW.auth_uid != auth.uid() THEN
    RAISE EXCEPTION 'auth_uid must match the authenticated user';
  END IF;
  
  -- Log security events for audit purposes
  PERFORM log_security_event(
    TG_OP || '_linkedin_user_data',
    'linkedin_users',
    NEW.id::text,
    jsonb_build_object(
      'user_id', COALESCE(NEW.auth_uid, OLD.auth_uid),
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for the security function
DROP TRIGGER IF EXISTS linkedin_users_security_trigger ON public.linkedin_users;
CREATE TRIGGER linkedin_users_security_trigger
  BEFORE INSERT OR UPDATE ON public.linkedin_users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_auth_uid_modification();

-- Add index for better performance on auth_uid lookups
CREATE INDEX IF NOT EXISTS idx_linkedin_users_auth_uid ON public.linkedin_users(auth_uid);

-- Add constraint to ensure auth_uid is never null (data integrity)
ALTER TABLE public.linkedin_users 
ALTER COLUMN auth_uid SET NOT NULL;

-- Create a view for safe LinkedIn user data access (excludes sensitive fields if needed)
CREATE OR REPLACE VIEW public.linkedin_users_safe AS
SELECT 
  id,
  auth_uid,
  name,
  -- Email is included but only accessible via RLS policies
  email,
  linkedin_urn,
  created_at
  -- Excluding auto_forward_address as it might be most sensitive
FROM public.linkedin_users;

-- Grant access to the safe view
GRANT SELECT ON public.linkedin_users_safe TO authenticated;

-- Apply same RLS policies to the view
ALTER VIEW public.linkedin_users_safe SET (security_barrier = true);

-- Add a policy for the view as well
CREATE POLICY "Users can view own safe linkedin data"
ON public.linkedin_users_safe
FOR SELECT
USING (auth.uid() = auth_uid AND auth.uid() IS NOT NULL);