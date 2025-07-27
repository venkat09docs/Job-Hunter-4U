-- Create job_tracker table for tracking job applications
CREATE TABLE public.job_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  job_url TEXT,
  salary_range TEXT,
  location TEXT,
  contact_person TEXT,
  contact_email TEXT,
  next_follow_up DATE,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_tracker ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own job tracker entries" 
ON public.job_tracker 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job tracker entries" 
ON public.job_tracker 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job tracker entries" 
ON public.job_tracker 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job tracker entries" 
ON public.job_tracker 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_job_tracker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_tracker_updated_at
  BEFORE UPDATE ON public.job_tracker
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_tracker_updated_at();