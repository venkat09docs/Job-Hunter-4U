-- First, let's extend the existing career system to support the requested functionality

-- Add module types if not exists
DO $$ BEGIN
    CREATE TYPE module_code AS ENUM ('RESUME','LINKEDIN','GITHUB');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add evidence types if not exists  
DO $$ BEGIN
    CREATE TYPE evidence_kind AS ENUM ('URL','EMAIL','SCREENSHOT','DATA_EXPORT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add signal types for tracking automated activities
DO $$ BEGIN
    CREATE TYPE signal_kind AS ENUM ('COMMENTED','REACTED','MENTIONED','INVITE_ACCEPTED','POST_PUBLISHED','PROFILE_UPDATED','COMMIT_PUSHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Extend career_task_templates to include module and cadence
ALTER TABLE career_task_templates 
ADD COLUMN IF NOT EXISTS module module_code,
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS cadence TEXT DEFAULT 'oneoff',
ADD COLUMN IF NOT EXISTS bonus_rules JSONB DEFAULT '{}'::jsonb;

-- Add unique constraint on code if it doesn't exist
DO $$ BEGIN
    ALTER TABLE career_task_templates ADD CONSTRAINT unique_template_code UNIQUE (code);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Extend career_task_assignments to include period for weekly tasks
ALTER TABLE career_task_assignments 
ADD COLUMN IF NOT EXISTS period TEXT,
ADD COLUMN IF NOT EXISTS score_awarded INTEGER DEFAULT 0;

-- Add unique constraint for user, template, period combination
DO $$ BEGIN
    ALTER TABLE career_task_assignments ADD CONSTRAINT unique_user_template_period UNIQUE (user_id, template_id, period);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Extend career_task_evidence to use the new evidence kinds
ALTER TABLE career_task_evidence 
ADD COLUMN IF NOT EXISTS kind evidence_kind,
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS email_meta JSONB,
ADD COLUMN IF NOT EXISTS parsed_json JSONB;

-- Create signals table for tracking automated activities
CREATE TABLE IF NOT EXISTS public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind signal_kind NOT NULL,
  actor TEXT,
  subject TEXT,
  link TEXT,
  happened_at TIMESTAMPTZ NOT NULL,
  raw_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signals_user_time ON public.signals (user_id, happened_at DESC);

-- Create user_inputs table for storing profile URLs, target keywords, etc.
CREATE TABLE IF NOT EXISTS public.user_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, key)
);

-- Create resume_checks table for automated resume analysis
CREATE TABLE IF NOT EXISTS public.resume_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_id UUID REFERENCES career_task_evidence(id) ON DELETE CASCADE,
  pages INTEGER,
  words INTEGER,
  has_email BOOLEAN,
  has_phone BOOLEAN,
  has_links BOOLEAN,
  keyword_match_ratio NUMERIC,
  last_checked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_badges table (extend existing linkedin_badges system)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES linkedin_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for signals
CREATE POLICY "Users can view their own signals" ON public.signals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert signals" ON public.signals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all signals" ON public.signals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_inputs
CREATE POLICY "Users can manage their own inputs" ON public.user_inputs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for resume_checks
CREATE POLICY "Users can view their own resume checks" ON public.resume_checks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage resume checks" ON public.resume_checks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage user badges" ON public.user_badges
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update function to handle updated_at for user_inputs
CREATE OR REPLACE FUNCTION public.update_user_inputs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_inputs_updated_at
  BEFORE UPDATE ON public.user_inputs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_inputs_updated_at();