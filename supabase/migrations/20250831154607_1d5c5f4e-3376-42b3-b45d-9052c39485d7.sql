-- Create payout_settings table for storing affiliate user payment preferences
CREATE TABLE public.payout_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_user_id UUID NOT NULL,
    payment_method TEXT NOT NULL,
    account_details TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    ifsc_code TEXT,
    bank_name TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payout_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for payout settings
CREATE POLICY "Users can manage their own payout settings" 
ON public.payout_settings 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM affiliate_users au 
    WHERE au.id = payout_settings.affiliate_user_id 
    AND au.user_id = auth.uid()
));

CREATE POLICY "Admins and recruiters can view all payout settings" 
ON public.payout_settings 
FOR SELECT 
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'recruiter'::app_role)
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payout_settings_updated_at
    BEFORE UPDATE ON public.payout_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint to ensure one setting per affiliate user
ALTER TABLE public.payout_settings 
ADD CONSTRAINT unique_affiliate_payout_setting 
UNIQUE (affiliate_user_id);