-- Fix the create_payment_record function with correct column mapping
CREATE OR REPLACE FUNCTION create_payment_record(
  p_user_id UUID,
  p_razorpay_order_id TEXT,
  p_amount INTEGER,
  p_plan_name TEXT,
  p_plan_duration TEXT
) RETURNS UUID AS $$
DECLARE
    payment_id UUID;
BEGIN
    INSERT INTO payment_records (
        user_id,
        razorpay_order_id,
        amount,
        plan_name,
        plan_duration,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_razorpay_order_id,
        p_amount,
        p_plan_name,
        p_plan_duration,
        'pending',
        now(),
        now()
    ) RETURNING id INTO payment_id;
    
    RETURN payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;