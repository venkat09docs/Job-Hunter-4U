-- Create hr_details table to store automated job hunting submissions
CREATE TABLE public.hr_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  hr_name TEXT,
  hr_email TEXT NOT NULL,
  hr_phone TEXT,
  company_website TEXT,
  company_linkedin TEXT,
  company_employees TEXT,
  company_founded_year TEXT,
  contact_source TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  cover_letter_url TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.hr_details ENABLE ROW LEVEL SECURITY;

-- Users can only view their own hr_details
CREATE POLICY "Users can view their own hr details"
  ON public.hr_details
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own hr_details
CREATE POLICY "Users can insert their own hr details"
  ON public.hr_details
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own hr_details
CREATE POLICY "Users can update their own hr details"
  ON public.hr_details
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own hr_details
CREATE POLICY "Users can delete their own hr details"
  ON public.hr_details
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all hr_details
CREATE POLICY "Admins can view all hr details"
  ON public.hr_details
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_hr_details_updated_at
  BEFORE UPDATE ON public.hr_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;