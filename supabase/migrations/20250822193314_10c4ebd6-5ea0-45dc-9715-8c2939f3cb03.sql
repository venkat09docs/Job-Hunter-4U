-- Fix the payments table INSERT issue by debugging the exact column structure
-- Let's create a completely new create_payment_record function that explicitly specifies columns
CREATE OR REPLACE FUNCTION public.create_payment_record(
  p_user_id uuid, 
  p_razorpay_order_id text, 
  p_amount integer, 
  p_plan_name text, 
  p_plan_duration text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payment_id UUID;
BEGIN
  -- First check if payment record already exists
  SELECT id INTO payment_id 
  FROM public.payments 
  WHERE razorpay_order_id = p_razorpay_order_id 
  AND user_id = p_user_id
  LIMIT 1;
  
  IF payment_id IS NOT NULL THEN
    RAISE LOG 'Payment record already exists with ID: %', payment_id;
    RETURN payment_id;
  END IF;

  -- Log the function parameters
  RAISE LOG 'Creating payment record with: user_id=%, order_id=%, amount=%, plan_name=%, plan_duration=%', 
    p_user_id, p_razorpay_order_id, p_amount, p_plan_name, p_plan_duration;

  -- Insert new payment record - explicitly specify all columns except those with defaults
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
  
  RAISE LOG 'Payment record created successfully with ID: %', payment_id;
  RETURN payment_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating payment record: % %, SQLSTATE: %', SQLERRM, SQLSTATE, SQLERRM;
    RAISE;
END;
$$;