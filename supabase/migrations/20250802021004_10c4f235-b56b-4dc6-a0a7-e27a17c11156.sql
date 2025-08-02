-- Create github_progress table
CREATE TABLE public.github_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.github_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own GitHub progress" 
ON public.github_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GitHub progress" 
ON public.github_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GitHub progress" 
ON public.github_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own GitHub progress" 
ON public.github_progress 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_github_progress_updated_at
BEFORE UPDATE ON public.github_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add the new page to premium_features
INSERT INTO public.premium_features (feature_key, feature_name, description, is_premium)
VALUES ('page_github_optimization', 'GitHub Profile Optimization', 'Access to GitHub profile optimization tools and checklist', true);