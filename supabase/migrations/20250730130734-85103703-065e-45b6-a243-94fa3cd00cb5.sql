-- Create resume_data table to store user resume information
CREATE TABLE public.resume_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  personal_details JSONB DEFAULT '{}'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills_interests JSONB DEFAULT '{}'::jsonb,
  certifications_awards JSONB DEFAULT '[]'::jsonb,
  professional_summary TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.resume_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own resume data" 
ON public.resume_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume data" 
ON public.resume_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume data" 
ON public.resume_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume data" 
ON public.resume_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resume_data_updated_at
BEFORE UPDATE ON public.resume_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();