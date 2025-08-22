-- Update the payment validation function to properly handle service role operations
CREATE OR REPLACE FUNCTION public.validate_payment_data_secure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if this is a service role operation (from edge functions)
  -- The service role should have permission to create payments for any user
  DECLARE
    current_role_name text;
  BEGIN
    SELECT current_setting('role', true) INTO current_role_name;
    
    -- Allow service role to bypass user validation (for edge functions)
    IF current_role_name = 'service_role' OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
      -- Service role can create/modify payments for any user
      RAISE LOG 'Payment operation authorized for service role';
    ELSE
      -- For regular users, ensure they can only modify their own payments
      IF NEW.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot create or modify payments for another user';
      END IF;
      
      -- Ensure we have a valid authenticated user
      IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required for payment operations';
      END IF;
      
      -- For UPDATE operations, prevent users from modifying critical payment fields
      IF TG_OP = 'UPDATE' THEN
        IF OLD.razorpay_payment_id IS DISTINCT FROM NEW.razorpay_payment_id 
           OR OLD.razorpay_order_id IS DISTINCT FROM NEW.razorpay_order_id
           OR OLD.amount IS DISTINCT FROM NEW.amount THEN
          RAISE EXCEPTION 'Cannot modify critical payment fields: payment_id, order_id, amount';
        END IF;
      END IF;
    END IF;
  END;
  
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
    RAISE EXCEPTION 'Invalid payment status';
  END IF;
  
  RETURN NEW;
END;
$function$;