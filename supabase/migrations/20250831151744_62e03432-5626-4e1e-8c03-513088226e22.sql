-- Drop and recreate the process_affiliate_referral function with better logging
DROP FUNCTION IF EXISTS process_affiliate_referral(uuid, numeric, uuid);

CREATE OR REPLACE FUNCTION process_affiliate_referral(
  p_referred_user_id UUID,
  p_payment_amount DECIMAL,
  p_payment_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affiliate_code TEXT;
  v_affiliate_user_id UUID;
  v_commission_amount DECIMAL;
  v_commission_rate DECIMAL := 10.00; -- 10% commission
  v_result JSON := '{"processed": false, "reason": "no_affiliate_code"}'::JSON;
BEGIN
  RAISE LOG 'Starting affiliate processing for user: %, amount: %', p_referred_user_id, p_payment_amount;
  
  -- Get affiliate code from user metadata
  SELECT raw_user_meta_data->>'affiliate_code' 
  INTO v_affiliate_code
  FROM auth.users 
  WHERE id = p_referred_user_id;
  
  RAISE LOG 'Found affiliate code: %', COALESCE(v_affiliate_code, 'NULL');
  
  -- If affiliate code exists, process referral
  IF v_affiliate_code IS NOT NULL THEN
    RAISE LOG 'Processing referral for affiliate code: %', v_affiliate_code;
    
    -- Get affiliate user
    SELECT id INTO v_affiliate_user_id
    FROM public.affiliate_users 
    WHERE affiliate_code = v_affiliate_code AND is_eligible = true;
    
    RAISE LOG 'Found affiliate user: %', COALESCE(v_affiliate_user_id::TEXT, 'NULL');
    
    IF v_affiliate_user_id IS NOT NULL THEN
      -- Calculate commission
      v_commission_amount := (p_payment_amount * v_commission_rate / 100);
      
      RAISE LOG 'Calculated commission: % (rate: %)', v_commission_amount, v_commission_rate;
      
      -- Insert referral record
      INSERT INTO public.affiliate_referrals (
        affiliate_user_id,
        referred_user_id,
        subscription_amount,
        commission_rate,
        commission_amount,
        payment_id,
        status
      ) VALUES (
        v_affiliate_user_id,
        p_referred_user_id,
        p_payment_amount,
        v_commission_rate,
        v_commission_amount,
        p_payment_id,
        'pending'
      );
      
      RAISE LOG 'Inserted affiliate referral record successfully';
      
      -- Update affiliate user totals
      UPDATE public.affiliate_users
      SET 
        total_earnings = total_earnings + v_commission_amount,
        total_referrals = total_referrals + 1,
        updated_at = now()
      WHERE id = v_affiliate_user_id;
      
      RAISE LOG 'Updated affiliate user totals successfully';
      
      v_result := json_build_object(
        'processed', true,
        'affiliate_code', v_affiliate_code,
        'commission_amount', v_commission_amount,
        'affiliate_user_id', v_affiliate_user_id
      );
    ELSE
      RAISE LOG 'No eligible affiliate user found for code: %', v_affiliate_code;
      v_result := json_build_object('processed', false, 'reason', 'affiliate_not_eligible', 'code', v_affiliate_code);
    END IF;
  ELSE
    RAISE LOG 'No affiliate code found in user metadata';
    v_result := json_build_object('processed', false, 'reason', 'no_affiliate_code');
  END IF;
  
  RETURN v_result;
END;
$$;