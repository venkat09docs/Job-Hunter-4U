-- Create table to store job search results
CREATE TABLE public.job_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id TEXT NOT NULL, -- External job ID from the API
  job_title TEXT NOT NULL,
  employer_name TEXT NOT NULL,
  job_location TEXT,
  job_description TEXT,
  job_apply_link TEXT,
  job_posted_at TEXT,
  job_min_salary INTEGER,
  job_max_salary INTEGER,
  job_salary_period TEXT,
  job_employment_type TEXT,
  search_query JSONB NOT NULL, -- Store the search parameters used
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.job_results ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own job results" 
ON public.job_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job results" 
ON public.job_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job results" 
ON public.job_results 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job results" 
ON public.job_results 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_job_results_updated_at
BEFORE UPDATE ON public.job_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_job_results_user_id ON public.job_results(user_id);
CREATE INDEX idx_job_results_created_at ON public.job_results(created_at DESC);