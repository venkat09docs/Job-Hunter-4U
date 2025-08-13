-- Create table for daily GitHub management flow sessions
CREATE TABLE IF NOT EXISTS public.github_daily_flow_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  tasks jsonb NOT NULL DEFAULT '{}',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.github_daily_flow_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for user-specific access
CREATE POLICY "Users can view their own daily flow sessions"
ON public.github_daily_flow_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily flow sessions"
ON public.github_daily_flow_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily flow sessions"
ON public.github_daily_flow_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily flow sessions"
ON public.github_daily_flow_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_github_daily_flow_sessions_user_date
ON public.github_daily_flow_sessions (user_id, session_date);

CREATE INDEX IF NOT EXISTS idx_github_daily_flow_sessions_user_completed
ON public.github_daily_flow_sessions (user_id, completed);

-- Trigger to maintain updated_at
CREATE TRIGGER update_github_daily_flow_sessions_updated_at
BEFORE UPDATE ON public.github_daily_flow_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();