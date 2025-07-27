-- Create linkedin_automations table to track automation settings and runs
CREATE TABLE public.linkedin_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  location TEXT,
  keywords TEXT,
  frequency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  job_matches_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_chat_logs table to store chat conversations
CREATE TABLE public.ai_chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.linkedin_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for linkedin_automations
CREATE POLICY "Users can view their own LinkedIn automations" 
ON public.linkedin_automations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own LinkedIn automations" 
ON public.linkedin_automations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LinkedIn automations" 
ON public.linkedin_automations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LinkedIn automations" 
ON public.linkedin_automations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for ai_chat_logs
CREATE POLICY "Users can view their own chat logs" 
ON public.ai_chat_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat logs" 
ON public.ai_chat_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat logs" 
ON public.ai_chat_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat logs" 
ON public.ai_chat_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_linkedin_automations_updated_at
BEFORE UPDATE ON public.linkedin_automations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();