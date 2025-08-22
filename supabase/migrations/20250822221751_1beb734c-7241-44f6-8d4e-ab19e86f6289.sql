-- Create ATS score history table
CREATE TABLE public.ats_score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_name TEXT NOT NULL,
  role TEXT NOT NULL,
  job_description TEXT NOT NULL,
  ats_score INTEGER NOT NULL,
  analysis_result JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ats_score_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own ATS history" 
ON public.ats_score_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ATS history" 
ON public.ats_score_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ATS history" 
ON public.ats_score_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ATS history" 
ON public.ats_score_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_ats_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ats_history_updated_at
BEFORE UPDATE ON public.ats_score_history
FOR EACH ROW
EXECUTE FUNCTION public.update_ats_history_updated_at();