-- Create a simplified validation function that won't cause INSERT issues
CREATE OR REPLACE FUNCTION public.validate_payment_essential()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate payment amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;
  
  -- Ensure required fields are present
  IF NEW.plan_name IS NULL OR NEW.plan_name = '' THEN
    RAISE EXCEPTION 'Plan name is required';
  END IF;
  
  -- Set default status if not provided
  IF NEW.status IS NULL THEN
    NEW.status := 'pending';
  END IF;
  
  -- Set default currency if not provided
  IF NEW.currency IS NULL THEN
    NEW.currency := 'INR';
  END IF;
  
  -- For non-service role operations, validate user ownership
  IF current_setting('role', true) != 'service_role' THEN
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create payments for another user';
    END IF;
    
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Authentication required for payment operations';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger for INSERT and UPDATE operations
CREATE TRIGGER validate_payment_essential_trigger
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_essential();