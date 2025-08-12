-- Create table for job application weekly activities
CREATE TABLE IF NOT EXISTS public.job_application_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL,
  task_id TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT job_application_activities_user_date_task_unique UNIQUE (user_id, activity_date, task_id)
);

-- Enable Row Level Security
ALTER TABLE public.job_application_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own job application activities"
ON public.job_application_activities
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job application activities"
ON public.job_application_activities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job application activities"
ON public.job_application_activities
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job application activities"
ON public.job_application_activities
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to keep updated_at current
CREATE TRIGGER update_job_application_activities_updated_at
BEFORE UPDATE ON public.job_application_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_job_application_activities_user_date
ON public.job_application_activities (user_id, activity_date);
