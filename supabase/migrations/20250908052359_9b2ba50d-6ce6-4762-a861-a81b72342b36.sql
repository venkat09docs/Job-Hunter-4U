-- Add payout confirmation fields and affiliate notification settings
ALTER TABLE payout_requests 
ADD COLUMN confirmed_by_user boolean DEFAULT false,
ADD COLUMN confirmed_by_user_at timestamp with time zone,
ADD COLUMN user_confirmation_notes text;

-- Create affiliate notification settings table
CREATE TABLE affiliate_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id uuid NOT NULL REFERENCES affiliate_users(id) ON DELETE CASCADE,
  payout_notifications boolean DEFAULT true,
  referral_notifications boolean DEFAULT true,
  commission_notifications boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  auto_payout_enabled boolean DEFAULT false,
  auto_payout_threshold numeric DEFAULT 1000.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(affiliate_user_id)
);

-- Enable RLS
ALTER TABLE affiliate_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for affiliate notification settings
CREATE POLICY "Users can manage their own affiliate notification settings"
ON affiliate_notification_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM affiliate_users au 
    WHERE au.id = affiliate_notification_settings.affiliate_user_id 
    AND au.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM affiliate_users au 
    WHERE au.id = affiliate_notification_settings.affiliate_user_id 
    AND au.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all affiliate notification settings"
ON affiliate_notification_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'recruiter'::app_role));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_affiliate_notification_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_notification_settings_updated_at
  BEFORE UPDATE ON affiliate_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_notification_settings_updated_at();