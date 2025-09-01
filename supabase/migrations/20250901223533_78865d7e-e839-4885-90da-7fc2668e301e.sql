-- Fix duplicate processing in affiliate referral system
-- Add unique constraint to prevent duplicate payment processing and fix calculation logic

-- First, let's add a unique constraint on payment_id to prevent duplicates
ALTER TABLE public.affiliate_referrals 
ADD CONSTRAINT unique_payment_id UNIQUE (payment_id);

-- Update the process_affiliate_referral function to prevent duplicate processing
CREATE OR REPLACE FUNCTION process_affiliate_referral(
  p_referred_user_id UUID,
  p_payment_amount DECIMAL,
  p_payment_id TEXT DEFAULT NULL
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
  v_existing_referral_id UUID;
BEGIN
  RAISE LOG 'Starting affiliate processing for user: %, amount: %, payment_id: %', p_referred_user_id, p_payment_amount, p_payment_id;
  
  -- Check if this payment_id has already been processed
  IF p_payment_id IS NOT NULL THEN
    SELECT id INTO v_existing_referral_id
    FROM public.affiliate_referrals 
    WHERE payment_id = p_payment_id;
    
    IF v_existing_referral_id IS NOT NULL THEN
      RAISE LOG 'Payment already processed: %', p_payment_id;
      RETURN json_build_object(
        'processed', false, 
        'reason', 'already_processed', 
        'payment_id', p_payment_id,
        'existing_referral_id', v_existing_referral_id
      );
    END IF;
  END IF;
  
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

-- Create a function to recalculate affiliate user totals based on actual referrals
CREATE OR REPLACE FUNCTION recalculate_affiliate_totals()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affiliate_record RECORD;
  calculated_earnings DECIMAL;
  calculated_referrals INTEGER;
BEGIN
  -- Loop through all affiliate users
  FOR affiliate_record IN 
    SELECT id, affiliate_code FROM public.affiliate_users
  LOOP
    -- Calculate actual totals from referrals table
    SELECT 
      COALESCE(SUM(commission_amount), 0),
      COALESCE(COUNT(*), 0)
    INTO calculated_earnings, calculated_referrals
    FROM public.affiliate_referrals 
    WHERE affiliate_user_id = affiliate_record.id;
    
    -- Update the affiliate user with correct totals
    UPDATE public.affiliate_users
    SET 
      total_earnings = calculated_earnings,
      total_referrals = calculated_referrals,
      updated_at = now()
    WHERE id = affiliate_record.id;
    
    RAISE LOG 'Updated affiliate % (%) - Earnings: %, Referrals: %', 
      affiliate_record.affiliate_code, 
      affiliate_record.id, 
      calculated_earnings, 
      calculated_referrals;
  END LOOP;
  
  RETURN 'Affiliate totals recalculated successfully';
END;
$$;