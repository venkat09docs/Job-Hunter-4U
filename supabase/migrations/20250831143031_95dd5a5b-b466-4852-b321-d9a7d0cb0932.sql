-- Create affiliate program tables

-- Create affiliate_users table to track who is eligible for affiliate program
CREATE TABLE public.affiliate_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL UNIQUE,
  is_eligible BOOLEAN NOT NULL DEFAULT false,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliate_referrals table to track who signed up through affiliate links
CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  commission_amount DECIMAL(10,2) NOT NULL,
  payment_id UUID, -- Reference to payment record
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id) -- Prevent duplicate referrals for same user
);

-- Create affiliate_commissions table for commission payouts
CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  referral_ids UUID[] NOT NULL, -- Array of referral IDs included in this commission
  payment_method TEXT,
  payment_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all affiliate tables
ALTER TABLE public.affiliate_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliate_users
CREATE POLICY "Users can view their own affiliate profile" 
ON public.affiliate_users 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins and recruiters can view all affiliate users" 
ON public.affiliate_users 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

CREATE POLICY "Admins and recruiters can manage affiliate eligibility" 
ON public.affiliate_users 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

CREATE POLICY "Users can insert their own affiliate profile" 
ON public.affiliate_users 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for affiliate_referrals  
CREATE POLICY "Affiliate users can view their referrals" 
ON public.affiliate_referrals 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.affiliate_users au 
  WHERE au.id = affiliate_referrals.affiliate_user_id 
  AND au.user_id = auth.uid()
));

CREATE POLICY "Admins and recruiters can view all referrals" 
ON public.affiliate_referrals 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

CREATE POLICY "Service role can manage referrals" 
ON public.affiliate_referrals 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for affiliate_commissions
CREATE POLICY "Affiliate users can view their commissions" 
ON public.affiliate_commissions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.affiliate_users au 
  WHERE au.id = affiliate_commissions.affiliate_user_id 
  AND au.user_id = auth.uid()
));

CREATE POLICY "Admins and recruiters can manage commissions" 
ON public.affiliate_commissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

-- Create indexes for performance
CREATE INDEX idx_affiliate_users_user_id ON public.affiliate_users(user_id);
CREATE INDEX idx_affiliate_users_code ON public.affiliate_users(affiliate_code);
CREATE INDEX idx_affiliate_referrals_affiliate_user_id ON public.affiliate_referrals(affiliate_user_id);
CREATE INDEX idx_affiliate_referrals_referred_user_id ON public.affiliate_referrals(referred_user_id);
CREATE INDEX idx_affiliate_commissions_affiliate_user_id ON public.affiliate_commissions(affiliate_user_id);

-- Create function to generate unique affiliate codes
CREATE OR REPLACE FUNCTION generate_affiliate_code(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base code from email (first 6 chars + random suffix)
  base_code := UPPER(LEFT(REPLACE(SPLIT_PART(user_email, '@', 1), '.', ''), 6));
  final_code := base_code || LPAD(counter::TEXT, 3, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.affiliate_users WHERE affiliate_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || LPAD(counter::TEXT, 3, '0');
  END LOOP;
  
  RETURN final_code;
END;
$$;

-- Create function to process affiliate referral
CREATE OR REPLACE FUNCTION process_affiliate_referral(
  p_referred_user_id UUID,
  p_payment_amount DECIMAL,
  p_payment_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affiliate_code TEXT;
  v_affiliate_user_id UUID;
  v_commission_amount DECIMAL;
  v_commission_rate DECIMAL := 10.00; -- 10% commission
BEGIN
  -- Get affiliate code from user metadata or session storage
  -- This would be set when user signs up through affiliate link
  SELECT raw_user_meta_data->>'affiliate_code' 
  INTO v_affiliate_code
  FROM auth.users 
  WHERE id = p_referred_user_id;
  
  -- If affiliate code exists, process referral
  IF v_affiliate_code IS NOT NULL THEN
    -- Get affiliate user
    SELECT id INTO v_affiliate_user_id
    FROM public.affiliate_users 
    WHERE affiliate_code = v_affiliate_code AND is_eligible = true;
    
    IF v_affiliate_user_id IS NOT NULL THEN
      -- Calculate commission
      v_commission_amount := (p_payment_amount * v_commission_rate / 100);
      
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
      
      -- Update affiliate user totals
      UPDATE public.affiliate_users
      SET 
        total_earnings = total_earnings + v_commission_amount,
        total_referrals = total_referrals + 1,
        updated_at = now()
      WHERE id = v_affiliate_user_id;
    END IF;
  END IF;
END;
$$;

-- Create function to update affiliate totals
CREATE OR REPLACE FUNCTION update_affiliate_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalculate totals for the affiliate user
  UPDATE public.affiliate_users
  SET 
    total_earnings = (
      SELECT COALESCE(SUM(commission_amount), 0)
      FROM public.affiliate_referrals
      WHERE affiliate_user_id = NEW.affiliate_user_id
      AND status IN ('pending', 'paid')
    ),
    total_referrals = (
      SELECT COUNT(*)
      FROM public.affiliate_referrals
      WHERE affiliate_user_id = NEW.affiliate_user_id
    ),
    updated_at = now()
  WHERE id = NEW.affiliate_user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update affiliate totals
CREATE TRIGGER update_affiliate_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.affiliate_referrals
FOR EACH ROW EXECUTE FUNCTION update_affiliate_totals();

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_users_updated_at
BEFORE UPDATE ON public.affiliate_users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_referrals_updated_at
BEFORE UPDATE ON public.affiliate_referrals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at
BEFORE UPDATE ON public.affiliate_commissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();