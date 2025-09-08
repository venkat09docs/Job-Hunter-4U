-- Create table to store commission rates per subscription plan
CREATE TABLE public.affiliate_plan_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.affiliate_plan_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage plan commissions" 
ON public.affiliate_plan_commissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active plan commissions" 
ON public.affiliate_plan_commissions 
FOR SELECT 
USING (is_active = true);

-- Insert default commission rates for existing plans
INSERT INTO public.affiliate_plan_commissions (plan_name, commission_rate, is_active, created_by) VALUES
('One Week Plan', 10.00, true, null),
('One Month Plan', 10.00, true, null),
('3 Months Plan', 12.00, true, null),
('6 Months Plan', 15.00, true, null),
('1 Year Plan', 20.00, true, null);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_affiliate_plan_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_plan_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_plan_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_affiliate_plan_commissions_updated_at();

-- Update affiliate_users table to make users automatically eligible
ALTER TABLE public.affiliate_users ALTER COLUMN is_eligible SET DEFAULT true;

-- Function to automatically create affiliate account on user signup
CREATE OR REPLACE FUNCTION public.create_affiliate_account_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  affiliate_code TEXT;
BEGIN
  -- Generate affiliate code using user email
  SELECT substring(md5(NEW.email || NEW.id::text), 1, 8) INTO affiliate_code;
  
  -- Insert affiliate user record
  INSERT INTO public.affiliate_users (
    user_id,
    affiliate_code,
    is_eligible,
    total_earnings,
    total_referrals
  ) VALUES (
    NEW.id,
    affiliate_code,
    true,
    0,
    0
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail user creation if affiliate creation fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create affiliate account on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_affiliate ON auth.users;
CREATE TRIGGER on_auth_user_created_affiliate
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_affiliate_account_on_signup();

-- Function to get commission rate for a plan
CREATE OR REPLACE FUNCTION public.get_commission_rate_for_plan(plan_name_param TEXT)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  commission_rate DECIMAL(5,2);
BEGIN
  SELECT apc.commission_rate 
  INTO commission_rate
  FROM public.affiliate_plan_commissions apc
  WHERE apc.plan_name = plan_name_param 
    AND apc.is_active = true;
  
  -- Return default 10% if plan not found
  RETURN COALESCE(commission_rate, 10.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the process_affiliate_referral function to use plan-specific commission rates
CREATE OR REPLACE FUNCTION public.process_affiliate_referral(
  p_referred_user_id UUID,
  p_payment_amount DECIMAL,
  p_payment_id TEXT DEFAULT NULL,
  p_plan_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  referrer_code TEXT;
  affiliate_user_record RECORD;
  commission_rate DECIMAL(5,2);
  commission_amount DECIMAL(10,2);
  result JSON;
BEGIN
  -- Get the referrer code from user metadata
  SELECT raw_user_meta_data->>'referrer_code' 
  INTO referrer_code
  FROM auth.users 
  WHERE id = p_referred_user_id;
  
  IF referrer_code IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No referrer code found'
    );
  END IF;
  
  -- Find the affiliate user by code
  SELECT * INTO affiliate_user_record
  FROM public.affiliate_users
  WHERE affiliate_code = referrer_code AND is_eligible = true;
  
  IF affiliate_user_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Referrer not found or not eligible'
    );
  END IF;
  
  -- Get commission rate for the specific plan
  SELECT public.get_commission_rate_for_plan(COALESCE(p_plan_name, 'One Week Plan')) 
  INTO commission_rate;
  
  -- Calculate commission amount
  commission_amount := (p_payment_amount * commission_rate / 100);
  
  -- Check if referral already exists
  IF EXISTS (
    SELECT 1 FROM public.affiliate_referrals 
    WHERE referred_user_id = p_referred_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Referral already exists'
    );
  END IF;
  
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
    affiliate_user_record.id,
    p_referred_user_id,
    p_payment_amount,
    commission_rate,
    commission_amount,
    p_payment_id,
    'pending'
  );
  
  -- Update affiliate user totals
  UPDATE public.affiliate_users
  SET 
    total_earnings = total_earnings + commission_amount,
    total_referrals = total_referrals + 1,
    updated_at = now()
  WHERE id = affiliate_user_record.id;
  
  result := json_build_object(
    'success', true,
    'message', 'Affiliate referral processed successfully',
    'commission_rate', commission_rate,
    'commission_amount', commission_amount,
    'affiliate_user_id', affiliate_user_record.id
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error processing affiliate referral: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;