-- Add comprehensive audit logging and additional security measures for payments
-- The service role access is necessary for payment processing, but we'll add safeguards

-- Create audit log table for payment access
CREATE TABLE IF NOT EXISTS public.payment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL,
  user_id uuid,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  performed_by_role text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role and admins can access audit logs
CREATE POLICY "Only service role can manage audit logs" 
ON public.payment_audit_log 
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view audit logs" 
ON public.payment_audit_log 
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create audit trigger for payments table
CREATE OR REPLACE FUNCTION public.audit_payment_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  audit_details jsonb := '{}';
BEGIN
  -- Build audit details
  IF TG_OP = 'INSERT' THEN
    audit_details := jsonb_build_object(
      'operation', 'INSERT',
      'new_data', row_to_json(NEW),
      'amount', NEW.amount,
      'plan_name', NEW.plan_name,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    audit_details := jsonb_build_object(
      'operation', 'UPDATE',
      'old_data', row_to_json(OLD),
      'new_data', row_to_json(NEW),
      'changed_fields', (
        SELECT json_object_agg(key, value)
        FROM json_each_text(row_to_json(NEW))
        WHERE value IS DISTINCT FROM (row_to_json(OLD) ->> key)
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    audit_details := jsonb_build_object(
      'operation', 'DELETE',
      'deleted_data', row_to_json(OLD)
    );
  END IF;

  -- Log the audit entry
  INSERT INTO public.payment_audit_log (
    payment_id,
    user_id,
    action,
    details,
    performed_by_role
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.user_id, OLD.user_id),
    TG_OP,
    audit_details,
    COALESCE(auth.role(), 'unknown')
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit trigger to payments table
DROP TRIGGER IF EXISTS audit_payment_access_trigger ON public.payments;
CREATE TRIGGER audit_payment_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_payment_access();

-- Create function to safely retrieve payment summaries (no sensitive details)
CREATE OR REPLACE FUNCTION public.get_user_payment_summary(target_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  payment_count bigint,
  total_amount_spent bigint,
  active_subscriptions bigint,
  last_payment_date timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COUNT(*) as payment_count,
    COALESCE(SUM(amount), 0) as total_amount_spent,
    COUNT(*) FILTER (WHERE status = 'completed') as active_subscriptions,
    MAX(created_at) as last_payment_date
  FROM public.payments 
  WHERE user_id = target_user_id
    AND (auth.uid() = target_user_id OR has_role(auth.uid(), 'admin'::app_role));
$$;

-- Add additional validation to payment trigger
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
    
    -- Prevent users from modifying critical payment fields
    IF TG_OP = 'UPDATE' THEN
      IF OLD.razorpay_payment_id IS DISTINCT FROM NEW.razorpay_payment_id 
         OR OLD.razorpay_order_id IS DISTINCT FROM NEW.razorpay_order_id
         OR OLD.amount IS DISTINCT FROM NEW.amount THEN
        RAISE EXCEPTION 'Cannot modify critical payment fields: payment_id, order_id, amount';
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
    RAISE EXCEPTION 'Invalid payment status';
  END IF;
  
  RETURN NEW;
END;
$$;