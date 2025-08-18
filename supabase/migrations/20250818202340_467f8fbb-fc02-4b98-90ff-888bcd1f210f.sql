-- CRITICAL SECURITY FIX: Secure the payments table with proper validation and audit controls

-- First, drop existing potentially problematic policies to start fresh
DROP POLICY IF EXISTS "Block all anonymous access to payments" ON public.payments;
DROP POLICY IF EXISTS "Users can only view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can only insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can only update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role has full payment access" ON public.payments;

-- Ensure RLS is enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 1. Completely block all anonymous access (highest priority)
CREATE POLICY "Block all anonymous access to payments"
ON public.payments
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 2. Block all public role access that isn't authenticated
CREATE POLICY "Block public role access to payments"
ON public.payments
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 3. Allow authenticated users to view only their own payments
CREATE POLICY "Users can view their own payments only"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 4. Allow authenticated users to insert their own payments only
CREATE POLICY "Users can create their own payments only"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 5. Restrict user updates to only non-critical fields (status updates only)
CREATE POLICY "Users can update limited payment fields only"
ON public.payments
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 6. Prevent users from deleting payments (financial records must be immutable)
CREATE POLICY "Block user deletion of payments"
ON public.payments
FOR DELETE
TO authenticated
USING (false);

-- 7. Service role maintains full access for system operations
CREATE POLICY "Service role has full payment access"
ON public.payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create enhanced validation function for payment data integrity
CREATE OR REPLACE FUNCTION public.validate_payment_data_secure()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user_id matches authenticated user (except for service role)
  IF current_setting('role') != 'service_role' THEN
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create or modify payments for another user';
    END IF;
    
    -- Ensure we have a valid authenticated user
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required for payment operations';
    END IF;
    
    -- For UPDATE operations, prevent users from modifying critical payment fields
    IF TG_OP = 'UPDATE' THEN
      -- Users can only update status, not payment IDs, amounts, or signatures
      IF OLD.razorpay_payment_id IS DISTINCT FROM NEW.razorpay_payment_id 
         OR OLD.razorpay_order_id IS DISTINCT FROM NEW.razorpay_order_id
         OR OLD.razorpay_signature IS DISTINCT FROM NEW.razorpay_signature
         OR OLD.amount IS DISTINCT FROM NEW.amount
         OR OLD.plan_name IS DISTINCT FROM NEW.plan_name
         OR OLD.user_id IS DISTINCT FROM NEW.user_id THEN
        RAISE EXCEPTION 'Cannot modify critical payment fields: payment_id, order_id, amount, signature, plan_name, user_id';
      END IF;
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
  
  -- Validate status values
  IF NEW.status NOT IN ('pending', 'completed', 'failed', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Invalid payment status: %', NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create comprehensive audit function
CREATE OR REPLACE FUNCTION public.audit_payment_operations()
RETURNS TRIGGER AS $$
DECLARE
  audit_details jsonb := '{}';
  current_user_id uuid := auth.uid();
  current_role text := current_setting('role');
BEGIN
  -- Build audit details based on operation type
  IF TG_OP = 'INSERT' THEN
    audit_details := jsonb_build_object(
      'operation', 'INSERT',
      'new_data', row_to_json(NEW),
      'amount', NEW.amount,
      'plan_name', NEW.plan_name,
      'status', NEW.status,
      'payment_method', 'razorpay'
    );
  ELSIF TG_OP = 'UPDATE' THEN
    audit_details := jsonb_build_object(
      'operation', 'UPDATE',
      'old_status', OLD.status,
      'new_status', NEW.status,
      'changed_fields', (
        SELECT json_object_agg(key, value)
        FROM json_each_text(row_to_json(NEW))
        WHERE value IS DISTINCT FROM (row_to_json(OLD) ->> key)
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    audit_details := jsonb_build_object(
      'operation', 'DELETE',
      'deleted_data', row_to_json(OLD),
      'amount', OLD.amount,
      'final_status', OLD.status
    );
  END IF;

  -- Log the audit entry
  INSERT INTO public.payment_audit_log (
    payment_id,
    user_id,
    action,
    details,
    performed_by_role,
    timestamp
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    audit_details,
    current_role
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create triggers for validation and auditing
CREATE TRIGGER validate_payment_data_trigger
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_data_secure();

CREATE TRIGGER audit_payment_operations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_payment_operations();