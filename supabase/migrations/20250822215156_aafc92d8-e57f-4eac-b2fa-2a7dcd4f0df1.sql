-- SECURITY FIX: LinkedIn Users Table - Personal Information Protection (Fixed)

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
CREATE OR REPLACE FUNCTION public.prevent_linkedin_auth_uid_modification()
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
  INSERT INTO public.security_audit_log (
    user_id,
    action_type,
    table_name,
    record_id,
    new_values
  ) VALUES (
    auth.uid(),
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
  EXECUTE FUNCTION prevent_linkedin_auth_uid_modification();

-- Add index for better performance on auth_uid lookups
CREATE INDEX IF NOT EXISTS idx_linkedin_users_auth_uid ON public.linkedin_users(auth_uid);

-- Ensure auth_uid is never null for data integrity
-- (This may fail if there are existing NULL values, but that's a separate data cleanup issue)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'linkedin_users' 
    AND constraint_type = 'NOT NULL' 
    AND column_name = 'auth_uid'
  ) THEN
    ALTER TABLE public.linkedin_users ALTER COLUMN auth_uid SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not set auth_uid NOT NULL constraint - there may be existing NULL values that need cleanup';
END $$;