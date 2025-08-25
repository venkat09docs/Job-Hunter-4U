-- Create a simple, bulletproof payment creation function
DROP FUNCTION IF EXISTS public.create_payment_record(uuid, text, integer, text, text);

CREATE OR REPLACE FUNCTION public.create_payment_record(
  p_user_id uuid, 
  p_razorpay_order_id text, 
  p_amount integer, 
  p_plan_name text, 
  p_plan_duration text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payment_id UUID;
BEGIN
  -- Check if payment already exists
  SELECT id INTO payment_id 
  FROM public.payments 
  WHERE razorpay_order_id = p_razorpay_order_id 
  AND user_id = p_user_id
  LIMIT 1;
  
  IF payment_id IS NOT NULL THEN
    RAISE LOG 'Payment already exists: %', payment_id;
    RETURN payment_id;
  END IF;

  -- Simple insert with only required fields - let defaults handle the rest
  INSERT INTO public.payments (user_id, razorpay_order_id, amount, plan_name, plan_duration)
  VALUES (p_user_id, p_razorpay_order_id, p_amount, p_plan_name, p_plan_duration)
  RETURNING id INTO payment_id;
  
  RAISE LOG 'Payment created: %', payment_id;
  RETURN payment_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Payment error: %, Code: %', SQLERRM, SQLSTATE;
    RAISE;
END;
$function$;