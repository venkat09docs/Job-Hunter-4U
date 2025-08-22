-- Fix the create_payment_record function - the INSERT statement has column/value mismatch
DROP FUNCTION IF EXISTS public.create_payment_record(UUID, TEXT, INTEGER, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_payment_record(
  p_user_id UUID,
  p_razorpay_order_id TEXT,
  p_amount INTEGER,
  p_plan_name TEXT,
  p_plan_duration TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  payment_id UUID;
  current_time TIMESTAMPTZ := NOW();
BEGIN
  -- Debug: Log the input parameters
  RAISE LOG 'Creating payment record with params: user_id=%, order_id=%, amount=%, plan_name=%, plan_duration=%', 
    p_user_id, p_razorpay_order_id, p_amount, p_plan_name, p_plan_duration;

  INSERT INTO public.payments (
    user_id,
    razorpay_order_id,
    amount,
    plan_name,
    plan_duration,
    status,
    currency,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_razorpay_order_id,
    p_amount,
    p_plan_name,
    p_plan_duration,
    'pending',
    'INR',
    current_time,
    current_time
  )
  RETURNING id INTO payment_id;
  
  RAISE LOG 'Payment record created successfully with ID: %', payment_id;
  RETURN payment_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating payment record: % %', SQLSTATE, SQLERRM;
    RAISE;
END;
$$;