-- Fix affiliate_referrals.payment_id column type to match function parameter
ALTER TABLE public.affiliate_referrals 
ALTER COLUMN payment_id TYPE TEXT USING payment_id::TEXT;