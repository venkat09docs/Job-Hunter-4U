-- Create new Career Activities schema for LinkedIn growth tasks

-- Create custom types first
DO $$ BEGIN
    CREATE TYPE evidence_type AS ENUM ('URL_REQUIRED','EMAIL_PROOF_OK','SCREENSHOT_OK','DATA_EXPORT_OK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verify_status AS ENUM ('NOT_STARTED','SUBMITTED','PARTIALLY_VERIFIED','VERIFIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE evidence_kind AS ENUM ('URL','EMAIL','SCREENSHOT','DATA_EXPORT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE signal_kind AS ENUM ('COMMENTED','REACTED','MENTIONED','INVITE_ACCEPTED','POST_PUBLISHED','PROFILE_UPDATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- USERS table (maps to auth.users)
CREATE TABLE IF NOT EXISTS public.linkedin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  linkedin_urn TEXT,
  auto_forward_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.linkedin_users ENABLE ROW LEVEL SECURITY;

-- TASK TEMPLATES
CREATE TABLE IF NOT EXISTS public.linkedin_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cadence TEXT DEFAULT 'weekly',
  evidence_types evidence_type[] NOT NULL,
  points_base INT NOT NULL DEFAULT 10,
  bonus_rules JSONB DEFAULT '{}'::JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.linkedin_tasks ENABLE ROW LEVEL SECURITY;

-- USER TASK INSTANCES (weekly)
CREATE TABLE IF NOT EXISTS public.linkedin_user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.linkedin_users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.linkedin_tasks(id) ON DELETE RESTRICT,
  period TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status verify_status DEFAULT 'NOT_STARTED',
  score_awarded INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, task_id, period)
);

-- Enable RLS
ALTER TABLE public.linkedin_user_tasks ENABLE ROW LEVEL SECURITY;

-- EVIDENCE
CREATE TABLE IF NOT EXISTS public.linkedin_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_task_id UUID REFERENCES public.linkedin_user_tasks(id) ON DELETE CASCADE,
  kind evidence_kind NOT NULL,
  url TEXT,
  file_key TEXT,
  email_meta JSONB,
  parsed_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.linkedin_evidence ENABLE ROW LEVEL SECURITY;

-- SIGNALS (derived from emails or exports)
CREATE TABLE IF NOT EXISTS public.linkedin_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.linkedin_users(id) ON DELETE CASCADE,
  kind signal_kind NOT NULL,
  actor TEXT,
  subject TEXT,
  link TEXT,
  happened_at TIMESTAMPTZ NOT NULL,
  raw_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create index
ALTER TABLE public.linkedin_signals ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_linkedin_signals_user_happened ON public.linkedin_signals (user_id, happened_at DESC);

-- SCORES
CREATE TABLE IF NOT EXISTS public.linkedin_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.linkedin_users(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  points_total INT NOT NULL DEFAULT 0,
  breakdown JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, period)
);

-- Enable RLS
ALTER TABLE public.linkedin_scores ENABLE ROW LEVEL SECURITY;

-- BADGES
CREATE TABLE IF NOT EXISTS public.linkedin_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.linkedin_badges ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.linkedin_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.linkedin_users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.linkedin_badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.linkedin_user_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for linkedin_users
CREATE POLICY "Users can view own profile" ON public.linkedin_users FOR SELECT USING (auth.uid() = auth_uid);
CREATE POLICY "Users can update own profile" ON public.linkedin_users FOR UPDATE USING (auth.uid() = auth_uid);
CREATE POLICY "Users can insert own profile" ON public.linkedin_users FOR INSERT WITH CHECK (auth.uid() = auth_uid);
CREATE POLICY "Admins can manage all users" ON public.linkedin_users FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for linkedin_tasks
CREATE POLICY "Everyone can view active tasks" ON public.linkedin_tasks FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage tasks" ON public.linkedin_tasks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for linkedin_user_tasks
CREATE POLICY "Users can view own tasks" ON public.linkedin_user_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.linkedin_users lu WHERE lu.id = user_id AND lu.auth_uid = auth.uid())
);
CREATE POLICY "Users can update own tasks" ON public.linkedin_user_tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.linkedin_users lu WHERE lu.id = user_id AND lu.auth_uid = auth.uid())
);
CREATE POLICY "Service role can manage all tasks" ON public.linkedin_user_tasks FOR ALL USING (true);
CREATE POLICY "Admins can manage all tasks" ON public.linkedin_user_tasks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for linkedin_evidence
CREATE POLICY "Users can view own evidence" ON public.linkedin_evidence FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.linkedin_user_tasks lut
    JOIN public.linkedin_users lu ON lut.user_id = lu.id
    WHERE lut.id = user_task_id AND lu.auth_uid = auth.uid()
  )
);
CREATE POLICY "Users can insert own evidence" ON public.linkedin_evidence FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.linkedin_user_tasks lut
    JOIN public.linkedin_users lu ON lut.user_id = lu.id
    WHERE lut.id = user_task_id AND lu.auth_uid = auth.uid()
  )
);
CREATE POLICY "Admins can manage all evidence" ON public.linkedin_evidence FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for linkedin_signals
CREATE POLICY "Users can view own signals" ON public.linkedin_signals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.linkedin_users lu WHERE lu.id = user_id AND lu.auth_uid = auth.uid())
);
CREATE POLICY "Service role can manage signals" ON public.linkedin_signals FOR ALL USING (true);
CREATE POLICY "Admins can manage all signals" ON public.linkedin_signals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for linkedin_scores
CREATE POLICY "Users can view own scores" ON public.linkedin_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.linkedin_users lu WHERE lu.id = user_id AND lu.auth_uid = auth.uid())
);
CREATE POLICY "Service role can manage scores" ON public.linkedin_scores FOR ALL USING (true);
CREATE POLICY "Admins can manage all scores" ON public.linkedin_scores FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create RLS policies for badges
CREATE POLICY "Everyone can view badges" ON public.linkedin_badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.linkedin_badges FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own badges" ON public.linkedin_user_badges FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.linkedin_users lu WHERE lu.id = user_id AND lu.auth_uid = auth.uid())
);
CREATE POLICY "Service role can manage user badges" ON public.linkedin_user_badges FOR ALL USING (true);
CREATE POLICY "Admins can manage all user badges" ON public.linkedin_user_badges FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_linkedin_user_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_linkedin_user_tasks_updated_at
  BEFORE UPDATE ON public.linkedin_user_tasks
  FOR EACH ROW EXECUTE FUNCTION update_linkedin_user_tasks_updated_at();

-- Seed initial tasks
INSERT INTO public.linkedin_tasks (code, title, description, evidence_types, points_base, bonus_rules) VALUES
('POST_ONCE', 'Publish 1 LinkedIn post this week', 'Create and publish one thoughtful LinkedIn post about your industry or career insights', ARRAY['URL_REQUIRED','EMAIL_PROOF_OK','SCREENSHOT_OK']::evidence_type[], 15, '{"bonus_engagement": 5, "min_reactions": 3}'::JSONB),
('COMMENT_3', 'Comment thoughtfully on 3 posts', 'Engage meaningfully with 3 different LinkedIn posts by adding valuable comments', ARRAY['URL_REQUIRED','EMAIL_PROOF_OK']::evidence_type[], 10, '{"bonus_mentions": 2}'::JSONB),
('INVITES_10', 'Send 10 personalized invites', 'Connect with 10 new professionals using personalized invitation messages', ARRAY['EMAIL_PROOF_OK','DATA_EXPORT_OK']::evidence_type[], 20, '{"bonus_acceptance": 5, "min_accepted": 1}'::JSONB),
('PROFILE_TUNEUP', 'Update Headline & About section', 'Refresh your LinkedIn profile headline and about section to reflect current goals', ARRAY['SCREENSHOT_OK','DATA_EXPORT_OK']::evidence_type[], 25, '{}'::JSONB)
ON CONFLICT (code) DO NOTHING;

-- Seed initial badges
INSERT INTO public.linkedin_badges (code, title, icon, criteria) VALUES
('WEEKLY_POSTER', 'Weekly Poster', '📝', '{"description": "Complete POST_ONCE task for 3 consecutive weeks", "requirement": "consecutive_weeks", "count": 3, "task": "POST_ONCE"}'::JSONB),
('ENGAGEMENT_MAGNET', 'Engagement Magnet', '🧲', '{"description": "Receive 10+ signals in a single week", "requirement": "signals_per_week", "count": 10}'::JSONB),
('CONSISTENT_3W', 'Consistency Champion', '🏆', '{"description": "Complete all weekly tasks for 3 weeks", "requirement": "all_tasks_weeks", "count": 3}'::JSONB),
('NETWORKER', 'Super Networker', '🤝', '{"description": "Complete INVITES_10 with 5+ acceptances", "requirement": "invite_acceptance", "count": 5}'::JSONB)
ON CONFLICT (code) DO NOTHING;