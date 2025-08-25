-- CRITICAL SECURITY FIX: Fix payment_records table RLS policies
-- The current "Service role can manage all payment records" policy allows ANY user to access ALL payment data

-- Drop the insecure policy that allows public access to all payment records
DROP POLICY IF EXISTS "Service role can manage all payment records" ON public.payment_records;

-- Create proper service role policy (restricted to service_role only)
CREATE POLICY "Service role can manage all payment records" 
ON public.payment_records 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Add admin access policy for administrative functions
CREATE POLICY "Admins can view all payment records" 
ON public.payment_records 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin management policy
CREATE POLICY "Admins can manage payment records" 
ON public.payment_records 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role)) 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure users can only update their own payment records (not insert new ones arbitrarily)
DROP POLICY IF EXISTS "Users can insert their own payment records" ON public.payment_records;

-- Users should not be able to insert payment records directly - only service role should
CREATE POLICY "Block user insertion of payment records" 
ON public.payment_records 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

-- Block anonymous access completely
CREATE POLICY "Block anonymous access to payment records" 
ON public.payment_records 
FOR ALL 
TO anon 
USING (false) 
WITH CHECK (false);

-- Users can only view their own payment records
DROP POLICY IF EXISTS "Users can view their own payment records" ON public.payment_records;

CREATE POLICY "Users can view their own payment records" 
ON public.payment_records 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Add update policy for users (limited fields only)
CREATE POLICY "Users can update their own payment record status" 
ON public.payment_records 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);