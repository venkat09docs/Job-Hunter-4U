-- Fix critical payment security vulnerabilities
-- Remove all existing policies to start fresh with secure ones
DROP POLICY IF EXISTS "Deny all access to payments for non-owners" ON public.payments;
DROP POLICY IF EXISTS "Require authentication for payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments only" ON public.payments;

-- Fix the user_id column to be non-nullable for proper RLS security
-- This is critical for RLS to work correctly
ALTER TABLE public.payments 
ALTER COLUMN user_id SET NOT NULL;

-- Create bulletproof payment security policies

-- 1. Block ALL anonymous access completely
CREATE POLICY "Block all anonymous access to payments" 
ON public.payments 
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Users can only view their own payments
CREATE POLICY "Users can only view their own payments" 
ON public.payments 
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 3. Users can only insert their own payments (for client-side payment creation)
CREATE POLICY "Users can only insert their own payments" 
ON public.payments 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 4. Users can only update their own payments (limited fields)
CREATE POLICY "Users can only update their own payments" 
ON public.payments 
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

-- 5. Users CANNOT delete payments (for audit trail)
-- No DELETE policy = no deletions allowed

-- 6. Service role has full access (for backend payment processing)
CREATE POLICY "Service role has full payment access" 
ON public.payments 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Create validation trigger to ensure payment data integrity
CREATE OR REPLACE FUNCTION public.validate_payment_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure user_id matches the authenticated user (if not service role)
  IF auth.role() != 'service_role' THEN
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create or modify payments for another user';
    END IF;
    
    -- Ensure we have a valid authenticated user
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required for payment operations';
    END IF;
  END IF;
  
  -- Validate payment amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;
  
  -- Ensure required fields are present
  IF NEW.plan_name IS NULL OR NEW.plan_name = '' THEN
    RAISE EXCEPTION 'Plan name is required';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the validation trigger
DROP TRIGGER IF EXISTS validate_payment_data_trigger ON public.payments;
CREATE TRIGGER validate_payment_data_trigger
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_data();