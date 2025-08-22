-- Fix the payment verification issue by ensuring payments table has correct structure and fixing the create_payment_record function

-- First ensure the payments table has all necessary columns
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS plan_duration TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- Update the create_payment_record function to match the actual table structure
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
BEGIN
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
    NOW(),
    NOW()
  )
  RETURNING id INTO payment_id;
  
  RETURN payment_id;
END;
$$;