-- Create table for LinkedIn network metrics
CREATE TABLE public.linkedin_network_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  activity_id TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, activity_id)
);

-- Enable Row Level Security
ALTER TABLE public.linkedin_network_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own network metrics" 
ON public.linkedin_network_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own network metrics" 
ON public.linkedin_network_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network metrics" 
ON public.linkedin_network_metrics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network metrics" 
ON public.linkedin_network_metrics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for LinkedIn network task completions
CREATE TABLE public.linkedin_network_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  task_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, task_id)
);

-- Enable Row Level Security
ALTER TABLE public.linkedin_network_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own network completions" 
ON public.linkedin_network_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own network completions" 
ON public.linkedin_network_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own network completions" 
ON public.linkedin_network_completions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own network completions" 
ON public.linkedin_network_completions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_linkedin_network_metrics_updated_at
BEFORE UPDATE ON public.linkedin_network_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_linkedin_network_completions_updated_at
BEFORE UPDATE ON public.linkedin_network_completions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();