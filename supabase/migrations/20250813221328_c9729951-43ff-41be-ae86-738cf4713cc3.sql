-- Ensure RLS is enabled on all sensitive tables and verify policies are working

-- Check and enable RLS on all sensitive tables
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_resumes ENABLE ROW LEVEL SECURITY;

-- Also ensure RLS is enabled on other sensitive tables that could be vulnerable
ALTER TABLE public.job_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_readme_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_network_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_network_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_daily_flow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Add missing policies for other sensitive tables that need authentication
-- For job_tracker (already has good policies but let's ensure they're secure)
DROP POLICY IF EXISTS "Users can view their own job tracker entries" ON public.job_tracker;
DROP POLICY IF EXISTS "Users can create their own job tracker entries" ON public.job_tracker;
DROP POLICY IF EXISTS "Users can update their own job tracker entries" ON public.job_tracker;
DROP POLICY IF EXISTS "Users can delete their own job tracker entries" ON public.job_tracker;

CREATE POLICY "Users can view their own job tracker entries only"
ON public.job_tracker
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job tracker entries only"
ON public.job_tracker
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job tracker entries only"
ON public.job_tracker
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job tracker entries only"
ON public.job_tracker
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- For saved_cover_letters
DROP POLICY IF EXISTS "Users can view their own cover letters" ON public.saved_cover_letters;
DROP POLICY IF EXISTS "Users can create their own cover letters" ON public.saved_cover_letters;
DROP POLICY IF EXISTS "Users can update their own cover letters" ON public.saved_cover_letters;
DROP POLICY IF EXISTS "Users can delete their own cover letters" ON public.saved_cover_letters;

CREATE POLICY "Users can view their own cover letters only"
ON public.saved_cover_letters
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cover letters only"
ON public.saved_cover_letters
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cover letters only"
ON public.saved_cover_letters
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cover letters only"
ON public.saved_cover_letters
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- For saved_job_searches
DROP POLICY IF EXISTS "Users can view their own saved searches" ON public.saved_job_searches;
DROP POLICY IF EXISTS "Users can create their own saved searches" ON public.saved_job_searches;
DROP POLICY IF EXISTS "Users can update their own saved searches" ON public.saved_job_searches;
DROP POLICY IF EXISTS "Users can delete their own saved searches" ON public.saved_job_searches;

CREATE POLICY "Users can view their own saved searches only"
ON public.saved_job_searches
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches only"
ON public.saved_job_searches
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches only"
ON public.saved_job_searches
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches only"
ON public.saved_job_searches
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- For saved_readme_files
DROP POLICY IF EXISTS "Users can view their own README files" ON public.saved_readme_files;
DROP POLICY IF EXISTS "Users can create their own README files" ON public.saved_readme_files;
DROP POLICY IF EXISTS "Users can update their own README files" ON public.saved_readme_files;
DROP POLICY IF EXISTS "Users can delete their own README files" ON public.saved_readme_files;

CREATE POLICY "Users can view their own README files only"
ON public.saved_readme_files
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own README files only"
ON public.saved_readme_files
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own README files only"
ON public.saved_readme_files
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own README files only"
ON public.saved_readme_files
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);