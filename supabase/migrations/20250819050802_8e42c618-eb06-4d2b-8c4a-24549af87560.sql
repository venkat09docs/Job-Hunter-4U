-- GITHUB WEEKLY SYSTEM SCHEMA

-- Create enums first
DO $$ BEGIN
    CREATE TYPE evidence_type AS ENUM ('URL_REQUIRED','SCREENSHOT_OK','FILE','EMAIL_PROOF_OK','DATA_EXPORT_OK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verify_status AS ENUM ('NOT_STARTED','SUBMITTED','PARTIALLY_VERIFIED','VERIFIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE signal_kind AS ENUM (
        'COMMIT_PUSHED','PR_OPENED','PR_MERGED','ISSUE_OPENED','ISSUE_CLOSED',
        'RELEASE_PUBLISHED','TAG_CREATED','README_UPDATED','TOPICS_UPDATED',
        'PAGES_DEPLOYED','ACTIONS_WORKFLOW_PASSED','STAR_ADDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE evidence_kind AS ENUM ('URL','SCREENSHOT','FILE','EMAIL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- REPOS (user-selected repositories to track)
CREATE TABLE IF NOT EXISTS public.github_repos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    full_name TEXT NOT NULL,             -- e.g. "owner/repo"
    html_url TEXT NOT NULL,
    default_branch TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, full_name)
);

-- Add foreign key reference to profiles
ALTER TABLE public.github_repos 
ADD CONSTRAINT github_repos_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- TASK TEMPLATES
CREATE TABLE IF NOT EXISTS public.github_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL,                 -- 'WEEKLY' or 'REPO'
    code TEXT UNIQUE NOT NULL,           -- e.g. GHW_COMMIT_3DAYS
    title TEXT NOT NULL,
    description TEXT,
    cadence TEXT DEFAULT 'weekly',       -- weekly or oneoff
    evidence_types evidence_type[] NOT NULL,
    points_base INTEGER NOT NULL DEFAULT 10,
    bonus_rules JSONB DEFAULT '{}'::jsonb,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- USER TASK INSTANCES (weekly or repo-specific)
CREATE TABLE IF NOT EXISTS public.github_user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_id UUID REFERENCES public.github_tasks(id) ON DELETE RESTRICT,
    period TEXT,                         -- 'YYYY-WW' for weekly; null for oneoff
    repo_id UUID REFERENCES public.github_repos(id) ON DELETE CASCADE,                        -- nullable for weekly/global tasks
    due_at TIMESTAMPTZ,
    status verify_status DEFAULT 'NOT_STARTED',
    score_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, task_id, period, repo_id)
);

-- Add foreign key reference to profiles
ALTER TABLE public.github_user_tasks 
ADD CONSTRAINT github_user_tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- EVIDENCE
CREATE TABLE IF NOT EXISTS public.github_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_task_id UUID REFERENCES public.github_user_tasks(id) ON DELETE CASCADE,
    kind evidence_kind NOT NULL,
    url TEXT,
    file_key TEXT,                        -- Supabase Storage key
    parsed_json JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- SIGNALS (from GitHub webhooks or snapshots)
CREATE TABLE IF NOT EXISTS public.github_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    repo_id UUID REFERENCES public.github_repos(id) ON DELETE SET NULL,
    kind signal_kind NOT NULL,
    actor TEXT,
    subject TEXT,
    link TEXT,
    happened_at TIMESTAMPTZ NOT NULL,
    raw_meta JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key reference to profiles
ALTER TABLE public.github_signals 
ADD CONSTRAINT github_signals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_github_signals_user_time ON public.github_signals (user_id, happened_at DESC);

-- SNAPSHOTS (public API reads as fallback/checks)
CREATE TABLE IF NOT EXISTS public.github_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    repo_id UUID REFERENCES public.github_repos(id) ON DELETE CASCADE,
    stars INTEGER,
    topics TEXT[],
    has_pages BOOLEAN,
    readme_updated_at TIMESTAMPTZ,
    last_workflow_pass TIMESTAMPTZ,
    last_release_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key reference to profiles
ALTER TABLE public.github_snapshots 
ADD CONSTRAINT github_snapshots_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- SCORES / BADGES
CREATE TABLE IF NOT EXISTS public.github_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    period TEXT NOT NULL,                 -- 'YYYY-WW'
    points_total INTEGER NOT NULL DEFAULT 0,
    breakdown JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, period)
);

-- Add foreign key reference to profiles
ALTER TABLE public.github_scores 
ADD CONSTRAINT github_scores_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.github_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    icon TEXT,
    criteria JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.github_user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_id UUID REFERENCES public.github_badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, badge_id)
);

-- Add foreign key reference to profiles
ALTER TABLE public.github_user_badges 
ADD CONSTRAINT github_user_badges_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Enable RLS on all tables
ALTER TABLE public.github_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can read/write only their rows
CREATE POLICY "Users can manage their own GitHub repos" ON public.github_repos
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view active GitHub tasks" ON public.github_tasks
    FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage GitHub tasks" ON public.github_tasks
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own GitHub user tasks" ON public.github_user_tasks
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own GitHub evidence" ON public.github_evidence
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.github_user_tasks gut 
            WHERE gut.id = github_evidence.user_task_id 
            AND gut.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.github_user_tasks gut 
            WHERE gut.id = github_evidence.user_task_id 
            AND gut.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own GitHub signals" ON public.github_signals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage GitHub signals" ON public.github_signals
    FOR ALL USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view their own GitHub snapshots" ON public.github_snapshots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage GitHub snapshots" ON public.github_snapshots
    FOR ALL USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can view their own GitHub scores" ON public.github_scores
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage GitHub scores" ON public.github_scores
    FOR ALL USING (true)
    WITH CHECK (true);

CREATE POLICY "Everyone can view GitHub badges" ON public.github_badges
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage GitHub badges" ON public.github_badges
    FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own GitHub user badges" ON public.github_user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage GitHub user badges" ON public.github_user_badges
    FOR ALL USING (true)
    WITH CHECK (true);

-- Create Storage bucket for GitHub evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'github-evidence',
    'github-evidence', 
    false,
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/markdown']
);

-- Storage policies for github-evidence bucket
CREATE POLICY "Users can upload their own GitHub evidence" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'github-evidence' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own GitHub evidence" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'github-evidence' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own GitHub evidence" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'github-evidence' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own GitHub evidence" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'github-evidence' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Seed GitHub tasks
INSERT INTO public.github_tasks (scope, code, title, description, evidence_types, points_base, bonus_rules) VALUES
-- Weekly Tasks
('WEEKLY', 'GHW_COMMIT_3DAYS', 'Commit on 3 distinct days this week', 'Make commits on at least 3 different calendar days this week to maintain consistency', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 15, '{"consistency_bonus": 5}'),
('WEEKLY', 'GHW_WEEKLY_CHANGELOG', 'Publish a weekly changelog', 'Create and publish a changelog documenting this week''s changes', ARRAY['URL_REQUIRED'::evidence_type], 12, '{"detailed_changelog": 3}'),
('WEEKLY', 'GHW_MERGE_1PR', 'Merge at least 1 PR', 'Successfully merge at least one pull request this week', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 10, '{"multiple_prs": 5}'),
('WEEKLY', 'GHW_CLOSE_2ISSUES', 'Close 2 issues with clear resolution', 'Close at least 2 issues with proper resolution and documentation', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 12, '{"detailed_resolution": 3}'),
('WEEKLY', 'GHW_README_TWEAK', 'Improve README', 'Enhance README with better documentation, badges, or examples', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 8, '{"comprehensive_update": 4}'),
('WEEKLY', 'GHW_CI_GREEN', '1 successful GitHub Actions workflow run', 'Have at least one successful CI/CD workflow execution', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 10, '{"multiple_workflows": 5}'),
('WEEKLY', 'GHW_PAGES_DEPLOY', 'Deploy site/docs to GitHub Pages', 'Deploy or update your GitHub Pages site', ARRAY['URL_REQUIRED'::evidence_type], 15, '{"custom_domain": 5}'),

-- Repo One-Time "Showcase Setup"
('REPO', 'GHS_ADD_TOPICS', 'Add ≥5 relevant topics to the repo', 'Add at least 5 relevant topics to help others discover your repository', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 8, '{"descriptive_topics": 2}'),
('REPO', 'GHS_PIN_REPO', 'Pin the repo on profile', 'Pin this repository on your GitHub profile for better visibility', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 5, '{}'),
('REPO', 'GHS_PROFILE_README', 'Create profile README', 'Create a profile README repository to showcase yourself', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 12, '{"creative_design": 5}'),
('REPO', 'GHS_PAGES_SETUP', 'Enable GitHub Pages with clean landing page', 'Set up GitHub Pages with a professional landing page', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 15, '{"custom_theme": 5}'),
('REPO', 'GHS_LICENSE_BADGE', 'Add LICENSE + badges to README', 'Add proper license and informative badges to your README', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type], 6, '{"multiple_badges": 2}'),
('REPO', 'GHS_DEMO_ASSETS', 'Add demo GIF/screenshot in README', 'Include visual demonstrations of your project in the README', ARRAY['URL_REQUIRED'::evidence_type, 'SCREENSHOT_OK'::evidence_type, 'FILE'::evidence_type], 8, '{"interactive_demo": 4}');

-- Seed GitHub badges
INSERT INTO public.github_badges (code, title, icon, criteria) VALUES
('WEEKLY_SHIPPER', 'Weekly Shipper', '🚀', '{"weekly_tasks_verified": 5, "timeframe": "week"}'),
('PR_CHAMP', 'PR Champion', '🏆', '{"prs_merged": 5, "timeframe": "month"}'),
('ISSUE_TAMER', 'Issue Tamer', '🐛', '{"issues_closed": 10, "timeframe": "month"}'),
('DOCS_DELIGHT', 'Docs Delight', '📚', '{"readme_updated": true, "pages_deployed": true}'),
('CONSISTENCY_KING', 'Consistency King', '👑', '{"commit_streak_days": 7}'),
('SHOWCASE_MASTER', 'Showcase Master', '⭐', '{"showcase_tasks_completed": 6}');

-- Update functions
CREATE OR REPLACE FUNCTION public.update_github_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_github_repos_updated_at
    BEFORE UPDATE ON public.github_repos
    FOR EACH ROW EXECUTE FUNCTION public.update_github_updated_at();

CREATE TRIGGER update_github_tasks_updated_at
    BEFORE UPDATE ON public.github_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_github_updated_at();

CREATE TRIGGER update_github_user_tasks_updated_at
    BEFORE UPDATE ON public.github_user_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_github_updated_at();