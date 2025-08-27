-- Create table for daily job hunting sessions
CREATE TABLE public.daily_job_hunting_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('morning', 'afternoon', 'evening')),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  tasks_completed JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_date, session_type)
);

-- Enable RLS
ALTER TABLE public.daily_job_hunting_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily sessions" 
ON public.daily_job_hunting_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily sessions" 
ON public.daily_job_hunting_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily sessions" 
ON public.daily_job_hunting_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily sessions" 
ON public.daily_job_hunting_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_job_hunting_sessions_updated_at
BEFORE UPDATE ON public.daily_job_hunting_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_job_hunting_updated_at();

-- Create index for better performance
CREATE INDEX idx_daily_job_hunting_sessions_user_date ON public.daily_job_hunting_sessions(user_id, session_date);
CREATE INDEX idx_daily_job_hunting_sessions_date_type ON public.daily_job_hunting_sessions(session_date, session_type);