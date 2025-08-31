-- Create payout_requests table for managing affiliate payouts
CREATE TABLE public.payout_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_user_id UUID NOT NULL,
    requested_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_by UUID NULL,
    approved_at TIMESTAMP WITH TIME ZONE NULL,
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    admin_notes TEXT NULL,
    rejection_reason TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Add constraint to ensure valid statuses
    CONSTRAINT valid_payout_status CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected'))
);

-- Enable RLS on payout_requests
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own payout requests
CREATE POLICY "Users can view their own payout requests" 
ON public.payout_requests 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM affiliate_users au 
    WHERE au.id = payout_requests.affiliate_user_id 
    AND au.user_id = auth.uid()
));

-- Policy for users to create their own payout requests
CREATE POLICY "Users can create their own payout requests" 
ON public.payout_requests 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM affiliate_users au 
    WHERE au.id = payout_requests.affiliate_user_id 
    AND au.user_id = auth.uid()
));

-- Policy for admins and recruiters to manage payout requests
CREATE POLICY "Admins and recruiters can manage payout requests" 
ON public.payout_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_payout_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payout_requests_updated_at
BEFORE UPDATE ON public.payout_requests
FOR EACH ROW
EXECUTE FUNCTION update_payout_requests_updated_at();