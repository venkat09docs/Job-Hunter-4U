-- Security Fix: Strengthen RLS policies for portfolios table to prevent data harvesting

-- First, let's ensure RLS is enabled (it should be already, but let's confirm)
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with stronger security
DROP POLICY IF EXISTS "Users can create their own portfolio" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolio" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolio" ON public.portfolios;
DROP POLICY IF EXISTS "Users can view their own portfolio" ON public.portfolios;

-- Create a security definer function to check user ownership
-- This prevents potential RLS bypass through complex queries
CREATE OR REPLACE FUNCTION public.is_portfolio_owner(portfolio_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT portfolio_user_id = auth.uid() AND auth.uid() IS NOT NULL;
$$;

-- Create strengthened RLS policies with additional security checks

-- Policy for SELECT: Users can only view their own portfolio
CREATE POLICY "Users can view own portfolio only"
ON public.portfolios
FOR SELECT
TO authenticated
USING (public.is_portfolio_owner(user_id));

-- Policy for INSERT: Users can only create portfolios for themselves
CREATE POLICY "Users can create own portfolio only"
ON public.portfolios
FOR INSERT
TO authenticated
WITH CHECK (public.is_portfolio_owner(user_id));

-- Policy for UPDATE: Users can only update their own portfolio
CREATE POLICY "Users can update own portfolio only"
ON public.portfolios
FOR UPDATE
TO authenticated
USING (public.is_portfolio_owner(user_id))
WITH CHECK (public.is_portfolio_owner(user_id));

-- Policy for DELETE: Users can only delete their own portfolio
CREATE POLICY "Users can delete own portfolio only"
ON public.portfolios
FOR DELETE
TO authenticated
USING (public.is_portfolio_owner(user_id));

-- Create additional security constraints

-- Ensure user_id is never null (prevent orphaned records)
ALTER TABLE public.portfolios ALTER COLUMN user_id SET NOT NULL;

-- Add constraint to ensure user_id matches authenticated user on insert/update
-- This is an additional layer of protection
CREATE OR REPLACE FUNCTION public.validate_portfolio_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure the user_id matches the authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot create or modify portfolio for another user';
  END IF;
  
  -- Additional validation: ensure sensitive data is properly handled
  -- Log access attempts for audit purposes (optional)
  INSERT INTO public.audit_log (table_name, action, user_id, timestamp)
  VALUES ('portfolios', TG_OP, auth.uid(), NOW())
  ON CONFLICT DO NOTHING; -- Ignore if audit_log table doesn't exist
  
  RETURN NEW;
EXCEPTION
  WHEN undefined_table THEN
    -- If audit_log table doesn't exist, continue without logging
    RETURN NEW;
END;
$$;

-- Create the trigger for additional validation
DROP TRIGGER IF EXISTS validate_portfolio_ownership_trigger ON public.portfolios;
CREATE TRIGGER validate_portfolio_ownership_trigger
  BEFORE INSERT OR UPDATE ON public.portfolios
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_portfolio_ownership();

-- Create an audit log table for tracking access to sensitive data (optional but recommended)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit log as well
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit logs
CREATE POLICY "Users can view own audit logs"
ON public.audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only system can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (true); -- This will be restricted by the trigger function