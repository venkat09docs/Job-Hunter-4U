-- CRITICAL SECURITY FIX: Remove dangerous anonymous access and implement proper RLS
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Require authentication for resume data" ON public.resume_data;
DROP POLICY IF EXISTS "Users can view their own resume data only" ON public.resume_data;
DROP POLICY IF EXISTS "Users can create their own resume data only" ON public.resume_data;
DROP POLICY IF EXISTS "Users can update their own resume data only" ON public.resume_data;
DROP POLICY IF EXISTS "Users can delete their own resume data only" ON public.resume_data;
DROP POLICY IF EXISTS "Deny all access to resume data for non-owners" ON public.resume_data;

-- Ensure RLS is enabled on resume_data table
ALTER TABLE public.resume_data ENABLE ROW LEVEL SECURITY;

-- Create secure, non-conflicting RLS policies

-- 1. Completely block all anonymous access (no exceptions)
CREATE POLICY "Block all anonymous access to resume data"
ON public.resume_data
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Completely block access for users who aren't authenticated
CREATE POLICY "Require authentication for resume access"
ON public.resume_data
FOR ALL
TO public
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 3. Authenticated users can only SELECT their own resume data
CREATE POLICY "Users can view their own resume data only"
ON public.resume_data
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Authenticated users can only INSERT their own resume data
CREATE POLICY "Users can create their own resume data only"
ON public.resume_data
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Authenticated users can only UPDATE their own resume data
CREATE POLICY "Users can update their own resume data only"
ON public.resume_data
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Authenticated users can only DELETE their own resume data
CREATE POLICY "Users can delete their own resume data only"
ON public.resume_data
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. Service role access for system operations (like the upsert function)
CREATE POLICY "Service role has full access for system operations"
ON public.resume_data
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add trigger to validate user_id matches authenticated user on insert/update
CREATE OR REPLACE FUNCTION public.validate_resume_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure the user_id matches the authenticated user (except for service role)
  IF current_setting('role') != 'service_role' THEN
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create or modify resume data for another user';
    END IF;
    
    -- Ensure we have a valid authenticated user
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required for resume operations';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger to enforce ownership validation
CREATE TRIGGER validate_resume_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.resume_data
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_resume_ownership();