-- Create job_searches table to log job search activities
CREATE TABLE public.job_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  search_query JSONB NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  results JSONB DEFAULT '[]'::jsonb,
  searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own job searches" 
ON public.job_searches 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job searches" 
ON public.job_searches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job searches" 
ON public.job_searches 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job searches" 
ON public.job_searches 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_searches_updated_at
BEFORE UPDATE ON public.job_searches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();