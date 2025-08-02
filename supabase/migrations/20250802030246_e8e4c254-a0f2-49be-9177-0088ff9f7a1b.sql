-- Create weekly progress snapshots table for dynamic tracking
CREATE TABLE public.weekly_progress_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  resume_progress INTEGER NOT NULL DEFAULT 0,
  linkedin_progress INTEGER NOT NULL DEFAULT 0,
  github_progress INTEGER NOT NULL DEFAULT 0,
  network_progress INTEGER NOT NULL DEFAULT 0,
  job_applications_count INTEGER NOT NULL DEFAULT 0,
  published_blogs_count INTEGER NOT NULL DEFAULT 0,
  total_resume_opens INTEGER NOT NULL DEFAULT 0,
  total_job_searches INTEGER NOT NULL DEFAULT 0,
  total_ai_queries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable Row Level Security
ALTER TABLE public.weekly_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own weekly snapshots" 
ON public.weekly_progress_snapshots 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Edge functions can insert weekly snapshots" 
ON public.weekly_progress_snapshots 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Edge functions can update weekly snapshots" 
ON public.weekly_progress_snapshots 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_weekly_snapshots_updated_at
BEFORE UPDATE ON public.weekly_progress_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();