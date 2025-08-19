-- Career Activities Tables for Task Management and Evidence Verification

-- Table for career activity task templates
CREATE TABLE public.career_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('linkedin_growth', 'supabase_practice', 'n8n_practice', 'networking', 'content_creation')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER NOT NULL, -- in minutes
  points_reward INTEGER NOT NULL DEFAULT 10,
  evidence_types TEXT[] NOT NULL, -- ['url', 'screenshot', 'email_forward', 'data_export']
  instructions JSONB NOT NULL,
  verification_criteria JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for user-specific task assignments
CREATE TABLE public.career_task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.career_task_templates(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Monday of the assigned week
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'verified', 'rejected')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id, week_start_date)
);

-- Table for evidence submissions
CREATE TABLE public.career_task_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.career_task_assignments(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('url', 'screenshot', 'email_forward', 'data_export', 'text_description')),
  evidence_data JSONB NOT NULL, -- Flexible structure for different evidence types
  file_urls TEXT[], -- Array of Supabase storage URLs for uploaded files
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'needs_review')),
  verification_notes TEXT,
  verified_by UUID, -- Admin/system user who verified
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for weekly task schedules (system generates tasks for users)
CREATE TABLE public.career_weekly_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL, -- Monday of the week
  total_tasks_assigned INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_points_possible INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  schedule_generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date)
);

-- Enable RLS on all tables
ALTER TABLE public.career_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_task_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_weekly_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for career_task_templates
CREATE POLICY "Everyone can view active templates" 
ON public.career_task_templates FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage templates" 
ON public.career_task_templates FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for career_task_assignments
CREATE POLICY "Users can view their own assignments" 
ON public.career_task_assignments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" 
ON public.career_task_assignments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage assignments" 
ON public.career_task_assignments FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert assignments" 
ON public.career_task_assignments FOR INSERT 
WITH CHECK (true);

-- RLS Policies for career_task_evidence
CREATE POLICY "Users can manage their own evidence" 
ON public.career_task_evidence FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.career_task_assignments cta 
  WHERE cta.id = assignment_id AND cta.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.career_task_assignments cta 
  WHERE cta.id = assignment_id AND cta.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all evidence" 
ON public.career_task_evidence FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for career_weekly_schedules
CREATE POLICY "Users can view their own schedules" 
ON public.career_weekly_schedules FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage schedules" 
ON public.career_weekly_schedules FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage schedules" 
ON public.career_weekly_schedules FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_career_task_assignments_user_week ON public.career_task_assignments(user_id, week_start_date);
CREATE INDEX idx_career_task_assignments_status ON public.career_task_assignments(status);
CREATE INDEX idx_career_task_evidence_assignment ON public.career_task_evidence(assignment_id);
CREATE INDEX idx_career_task_evidence_verification ON public.career_task_evidence(verification_status);
CREATE INDEX idx_career_weekly_schedules_user_week ON public.career_weekly_schedules(user_id, week_start_date);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_career_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_career_task_templates_updated_at
  BEFORE UPDATE ON public.career_task_templates
  FOR EACH ROW EXECUTE FUNCTION update_career_updated_at();

CREATE TRIGGER update_career_task_assignments_updated_at
  BEFORE UPDATE ON public.career_task_assignments
  FOR EACH ROW EXECUTE FUNCTION update_career_updated_at();

CREATE TRIGGER update_career_task_evidence_updated_at
  BEFORE UPDATE ON public.career_task_evidence
  FOR EACH ROW EXECUTE FUNCTION update_career_updated_at();

CREATE TRIGGER update_career_weekly_schedules_updated_at
  BEFORE UPDATE ON public.career_weekly_schedules
  FOR EACH ROW EXECUTE FUNCTION update_career_updated_at();

-- Insert default task templates
INSERT INTO public.career_task_templates (title, description, category, difficulty, estimated_duration, points_reward, evidence_types, instructions, verification_criteria) VALUES
-- LinkedIn Growth Tasks
('Connect with 10 Industry Professionals', 'Send personalized connection requests to professionals in your industry', 'linkedin_growth', 'beginner', 30, 15, ARRAY['screenshot'], 
 '{"steps": ["Search for professionals in your industry", "Send personalized connection requests", "Take screenshot of sent requests"], "tips": ["Personalize each message", "Mention common interests", "Keep it professional"]}',
 '{"required_connections": 10, "screenshot_requirements": ["Must show connection requests sent", "Must be from current week"]}'
),

('Post 3 Industry-Related Content Pieces', 'Create and share valuable content related to your industry', 'linkedin_growth', 'intermediate', 90, 25, ARRAY['url', 'screenshot'], 
 '{"steps": ["Research trending topics in your industry", "Create original posts or share insights", "Post consistently over the week"], "content_ideas": ["Industry news commentary", "Personal learning experiences", "Tips and best practices"]}',
 '{"required_posts": 3, "engagement_threshold": 2, "content_quality": "Must be original and industry-relevant"}'
),

('Engage with 50 Professional Posts', 'Like, comment, and share posts from your professional network', 'linkedin_growth', 'beginner', 45, 10, ARRAY['screenshot'], 
 '{"steps": ["Browse your LinkedIn feed daily", "Engage meaningfully with posts", "Track your engagement activity"], "engagement_types": ["Thoughtful comments", "Relevant likes", "Strategic shares"]}',
 '{"required_engagements": 50, "comment_quality": "Must be meaningful, not just emoji reactions"}'
),

-- Supabase Practice Tasks
('Build a Simple Todo App with Supabase', 'Create a basic todo application using Supabase backend', 'supabase_practice', 'intermediate', 180, 50, ARRAY['url', 'screenshot'], 
 '{"steps": ["Set up Supabase project", "Create database tables", "Implement CRUD operations", "Deploy the app"], "technologies": ["React", "Supabase", "TypeScript"], "requirements": ["User authentication", "Real-time updates", "Responsive design"]}',
 '{"demo_url_required": true, "code_repository": "GitHub link required", "features": ["Working CRUD operations", "User authentication", "Real-time sync"]}'
),

('Implement Row Level Security (RLS)', 'Add proper RLS policies to a Supabase project', 'supabase_practice', 'advanced', 120, 40, ARRAY['screenshot', 'text_description'], 
 '{"steps": ["Design security requirements", "Write RLS policies", "Test with different user roles", "Document the implementation"], "security_aspects": ["User isolation", "Role-based access", "Data protection"]}',
 '{"policy_coverage": "All tables must have appropriate policies", "testing_evidence": "Screenshots of testing with different users", "documentation": "Clear explanation of security model"}'
),

-- N8N Practice Tasks
('Create Email-to-Database Automation', 'Build an n8n workflow that processes emails and stores data in Supabase', 'n8n_practice', 'intermediate', 150, 45, ARRAY['screenshot', 'data_export'], 
 '{"steps": ["Set up n8n instance", "Configure email webhook", "Parse email content", "Store in Supabase"], "workflow_components": ["Email trigger", "Data parsing", "Database insertion", "Error handling"]}',
 '{"workflow_screenshot": "Must show complete n8n workflow", "test_data": "Proof of successful email processing", "database_records": "Screenshots of created records in Supabase"}'
),

('Build LinkedIn Post Scheduler', 'Create an automation that schedules and posts to LinkedIn', 'n8n_practice', 'advanced', 200, 60, ARRAY['screenshot', 'url'], 
 '{"steps": ["Set up LinkedIn API access", "Create scheduling logic", "Build content queue", "Implement posting automation"], "safety_notes": ["Respect LinkedIn ToS", "No scraping", "Use official API only"]}',
 '{"api_integration": "Must use LinkedIn official API", "scheduling_proof": "Screenshots of scheduled posts", "compliance": "Must follow LinkedIn terms of service"}'
);