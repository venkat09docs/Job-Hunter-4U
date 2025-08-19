-- Create job hunting assignments system

-- Job hunting task templates
CREATE TABLE IF NOT EXISTS public.job_hunting_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'research', 'apply', 'network', 'follow_up', 'interview'
  difficulty TEXT NOT NULL DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  points_reward INTEGER NOT NULL DEFAULT 10,
  estimated_duration INTEGER NOT NULL DEFAULT 30, -- minutes
  instructions JSONB NOT NULL DEFAULT '{}',
  verification_criteria JSONB NOT NULL DEFAULT '{}',
  evidence_types TEXT[] NOT NULL DEFAULT '{"url", "screenshot", "file"}',
  cadence TEXT NOT NULL DEFAULT 'weekly', -- 'weekly', 'daily', 'oneoff'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job hunting weekly assignments
CREATE TABLE IF NOT EXISTS public.job_hunting_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES job_hunting_task_templates(id),
  week_start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'in_progress', 'submitted', 'verified', 'rejected'
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  points_earned INTEGER DEFAULT 0,
  score_awarded INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job hunting evidence
CREATE TABLE IF NOT EXISTS public.job_hunting_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES job_hunting_assignments(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL, -- 'url', 'screenshot', 'file', 'email', 'text'
  evidence_data JSONB NOT NULL,
  file_urls TEXT[],
  verification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  verification_notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job hunting pipeline (extends job_tracker with pipeline stages)
CREATE TABLE IF NOT EXISTS public.job_hunting_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  job_tracker_id UUID REFERENCES job_tracker(id) ON DELETE CASCADE,
  pipeline_stage TEXT NOT NULL DEFAULT 'leads', -- 'leads', 'applied', 'interviewing', 'offers', 'closed'
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  source TEXT, -- 'linkedin', 'company_website', 'referral', 'job_board'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  notes JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  application_date DATE,
  interview_dates JSONB DEFAULT '[]',
  offer_details JSONB DEFAULT '{}',
  rejection_reason TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job hunting streaks and badges
CREATE TABLE IF NOT EXISTS public.job_hunting_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  streak_type TEXT NOT NULL, -- 'daily_application', 'weekly_research', 'follow_up'
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

-- Job hunting weekly schedules
CREATE TABLE IF NOT EXISTS public.job_hunting_weekly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  total_tasks_assigned INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  total_points_possible INTEGER NOT NULL DEFAULT 0,
  schedule_generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS
ALTER TABLE public.job_hunting_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_hunting_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_hunting_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_hunting_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_hunting_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_hunting_weekly_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Job hunting task templates (read-only for users, full access for admins)
CREATE POLICY "Everyone can view active job hunting templates"
  ON public.job_hunting_task_templates FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage job hunting templates"
  ON public.job_hunting_task_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Job hunting assignments (users can view/update their own)
CREATE POLICY "Users can view their own job hunting assignments"
  ON public.job_hunting_assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own job hunting assignments"
  ON public.job_hunting_assignments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert job hunting assignments"
  ON public.job_hunting_assignments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all job hunting assignments"
  ON public.job_hunting_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Job hunting evidence (users can manage their own)
CREATE POLICY "Users can manage their own job hunting evidence"
  ON public.job_hunting_evidence FOR ALL
  USING (EXISTS (
    SELECT 1 FROM job_hunting_assignments jha 
    WHERE jha.id = job_hunting_evidence.assignment_id 
    AND jha.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM job_hunting_assignments jha 
    WHERE jha.id = job_hunting_evidence.assignment_id 
    AND jha.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all job hunting evidence"
  ON public.job_hunting_evidence FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Job hunting pipeline (users can manage their own)
CREATE POLICY "Users can manage their own job hunting pipeline"
  ON public.job_hunting_pipeline FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Job hunting streaks (users can view/update their own)
CREATE POLICY "Users can manage their own job hunting streaks"
  ON public.job_hunting_streaks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Job hunting weekly schedules (users can view their own, system can manage)
CREATE POLICY "Users can view their own job hunting schedules"
  ON public.job_hunting_weekly_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage job hunting schedules"
  ON public.job_hunting_weekly_schedules FOR ALL
  WITH CHECK (true);

CREATE POLICY "System can manage job hunting schedules"
  ON public.job_hunting_weekly_schedules FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Insert default job hunting task templates
INSERT INTO public.job_hunting_task_templates (title, description, category, difficulty, points_reward, estimated_duration, instructions, verification_criteria, evidence_types, cadence) VALUES
('Research 10 Target Companies', 'Research and document 10 companies that align with your career goals', 'research', 'easy', 15, 60, 
 '{"steps": ["Use LinkedIn, Glassdoor, and company websites", "Document company size, culture, and recent news", "Note key decision makers and hiring managers", "Save job openings that match your profile"]}',
 '{"required": ["Company list with details", "Screenshots of research", "Notes on company culture and values"]}',
 '{"url", "screenshot", "text"}', 'weekly'),

('Apply to 5 Quality Positions', 'Submit high-quality applications to 5 relevant positions', 'apply', 'medium', 25, 90,
 '{"steps": ["Customize resume for each position", "Write tailored cover letters", "Submit applications through preferred channels", "Track application details"]}',
 '{"required": ["Application confirmations", "Customized resumes", "Cover letters", "Job posting URLs"]}',
 '{"url", "file", "screenshot", "email"}', 'weekly'),

('Network with 3 Industry Professionals', 'Connect and engage with 3 professionals in your target industry', 'network', 'medium', 20, 45,
 '{"steps": ["Send personalized LinkedIn connection requests", "Engage with their content meaningfully", "Schedule informational interviews if possible", "Follow up appropriately"]}',
 '{"required": ["LinkedIn connection screenshots", "Message screenshots", "Meeting confirmations"]}',
 '{"screenshot", "url", "text"}', 'weekly'),

('Follow Up on Previous Applications', 'Follow up on applications submitted 1-2 weeks ago', 'follow_up', 'easy', 10, 30,
 '{"steps": ["Review applications from 1-2 weeks ago", "Send polite follow-up emails", "Check application status on company portals", "Update your tracking system"]}',
 '{"required": ["Follow-up email screenshots", "Status update confirmations", "Updated tracking information"]}',
 '{"screenshot", "email", "text"}', 'weekly'),

('Prepare for Upcoming Interviews', 'Research and prepare for scheduled interviews', 'interview', 'hard', 30, 120,
 '{"steps": ["Research the company and interviewers", "Prepare answers to common questions", "Practice technical skills if applicable", "Prepare thoughtful questions to ask"]}',
 '{"required": ["Interview preparation notes", "Practice session evidence", "Questions prepared for interviewer"]}',
 '{"text", "file", "screenshot"}', 'weekly');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_job_hunting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_hunting_task_templates_updated_at
  BEFORE UPDATE ON public.job_hunting_task_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_job_hunting_updated_at();

CREATE TRIGGER update_job_hunting_assignments_updated_at
  BEFORE UPDATE ON public.job_hunting_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_job_hunting_updated_at();

CREATE TRIGGER update_job_hunting_evidence_updated_at
  BEFORE UPDATE ON public.job_hunting_evidence
  FOR EACH ROW EXECUTE FUNCTION public.update_job_hunting_updated_at();

CREATE TRIGGER update_job_hunting_pipeline_updated_at
  BEFORE UPDATE ON public.job_hunting_pipeline
  FOR EACH ROW EXECUTE FUNCTION public.update_job_hunting_updated_at();

CREATE TRIGGER update_job_hunting_streaks_updated_at
  BEFORE UPDATE ON public.job_hunting_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_job_hunting_updated_at();

CREATE TRIGGER update_job_hunting_weekly_schedules_updated_at
  BEFORE UPDATE ON public.job_hunting_weekly_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_job_hunting_updated_at();