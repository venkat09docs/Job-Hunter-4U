-- CRITICAL SECURITY FIX: Secure profiles table to prevent email theft and unauthorized data access

-- First, drop all existing potentially problematic policies
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile only" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Completely block all anonymous access (highest priority)
CREATE POLICY "Block all anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Block all public role access that isn't authenticated
CREATE POLICY "Block public role access to profiles"
ON public.profiles
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 3. Allow authenticated users to view ONLY their own profile
CREATE POLICY "Users can view their own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. Allow authenticated users to insert ONLY their own profile
CREATE POLICY "Users can create their own profile only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 5. Allow authenticated users to update ONLY their own profile
CREATE POLICY "Users can update their own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 6. Prevent regular users from deleting profiles (data retention)
CREATE POLICY "Block user deletion of profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);

-- 7. Service role maintains full access for system operations
CREATE POLICY "Service role has full profile access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create validation trigger to ensure profile ownership
CREATE OR REPLACE FUNCTION public.validate_profile_ownership_strict()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user_id matches authenticated user (except for service role)
  IF current_setting('role') != 'service_role' THEN
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger for profile ownership validation
CREATE TRIGGER validate_profile_ownership_strict_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_ownership_strict();