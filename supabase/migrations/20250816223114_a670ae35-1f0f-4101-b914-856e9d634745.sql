-- Completely lock down the ai_chat_logs table to ensure bulletproof security
-- Remove all existing policies to start fresh
DROP POLICY IF EXISTS "Deny all access to chat logs for non-owners" ON public.ai_chat_logs;
DROP POLICY IF EXISTS "Require authentication for chat logs" ON public.ai_chat_logs;
DROP POLICY IF EXISTS "Users can delete their own chat logs only" ON public.ai_chat_logs;
DROP POLICY IF EXISTS "Users can insert their own chat logs only" ON public.ai_chat_logs;
DROP POLICY IF EXISTS "Users can update their own chat logs only" ON public.ai_chat_logs;
DROP POLICY IF EXISTS "Users can view their own chat logs only" ON public.ai_chat_logs;

-- Create bulletproof policies that absolutely guarantee user isolation

-- 1. Completely block anonymous access
CREATE POLICY "Block all anonymous access to chat logs" 
ON public.ai_chat_logs 
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. SELECT: Users can only view their own chat logs
CREATE POLICY "Users can only view their own chat logs" 
ON public.ai_chat_logs 
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 3. INSERT: Users can only insert their own chat logs
CREATE POLICY "Users can only insert their own chat logs" 
ON public.ai_chat_logs 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 4. UPDATE: Users can only update their own chat logs
CREATE POLICY "Users can only update their own chat logs" 
ON public.ai_chat_logs 
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 5. DELETE: Users can only delete their own chat logs
CREATE POLICY "Users can only delete their own chat logs" 
ON public.ai_chat_logs 
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 6. Additional safety: Create a trigger to validate user_id on insert/update
CREATE OR REPLACE FUNCTION public.validate_chat_log_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure user_id matches the authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create or modify chat logs for another user';
  END IF;
  
  -- Ensure we have a valid authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required for chat log operations';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the validation trigger
DROP TRIGGER IF EXISTS validate_chat_log_ownership_trigger ON public.ai_chat_logs;
CREATE TRIGGER validate_chat_log_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.ai_chat_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_chat_log_ownership();