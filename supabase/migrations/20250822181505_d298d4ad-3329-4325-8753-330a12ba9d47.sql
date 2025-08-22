-- Create a function to handle payment record creation
CREATE OR REPLACE FUNCTION public.create_payment_record(
  p_user_id UUID,
  p_razorpay_order_id TEXT,
  p_amount INTEGER,
  p_plan_name TEXT,
  p_plan_duration TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payment_id UUID;
BEGIN
  INSERT INTO public.payments (
    user_id,
    razorpay_order_id,
    amount,
    plan_name,
    plan_duration,
    status,
    currency
  ) VALUES (
    p_user_id,
    p_razorpay_order_id,
    p_amount,
    p_plan_name,
    p_plan_duration,
    'pending',
    'INR'
  )
  RETURNING id INTO payment_id;
  
  RETURN payment_id;
END;
$function$;