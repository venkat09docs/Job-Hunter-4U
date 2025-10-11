-- Create table for storing user Gmail SMTP configurations
CREATE TABLE public.smtp_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  gmail_id TEXT NOT NULL,
  app_password TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.smtp_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own SMTP configuration
CREATE POLICY "Users can view their own SMTP configuration"
  ON public.smtp_configurations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own SMTP configuration
CREATE POLICY "Users can insert their own SMTP configuration"
  ON public.smtp_configurations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own SMTP configuration
CREATE POLICY "Users can update their own SMTP configuration"
  ON public.smtp_configurations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own SMTP configuration
CREATE POLICY "Users can delete their own SMTP configuration"
  ON public.smtp_configurations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_smtp_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_smtp_configurations_updated_at
  BEFORE UPDATE ON public.smtp_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_smtp_configurations_updated_at();