-- Create LinkedIn progress tracking table
CREATE TABLE public.linkedin_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Enable Row Level Security
ALTER TABLE public.linkedin_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own LinkedIn progress" 
ON public.linkedin_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own LinkedIn progress" 
ON public.linkedin_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LinkedIn progress" 
ON public.linkedin_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LinkedIn progress" 
ON public.linkedin_progress 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_linkedin_progress_updated_at
BEFORE UPDATE ON public.linkedin_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();