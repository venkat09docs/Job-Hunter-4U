-- Create table for dashboard click permissions
CREATE TABLE public.dashboard_click_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  requires_premium BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dashboard_click_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard click permissions
CREATE POLICY "Admins can manage dashboard click permissions" 
ON public.dashboard_click_permissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view dashboard click permissions" 
ON public.dashboard_click_permissions 
FOR SELECT 
USING (is_active = true);

-- Insert default dashboard click permissions
INSERT INTO public.dashboard_click_permissions (feature_key, feature_name, feature_description, requires_premium) VALUES
('resume_builder', 'Resume Builder', 'Access to resume building and editing functionality', false),
('cover_letter', 'Cover Letter Builder', 'Access to cover letter creation and templates', false),
('linkedin_optimization', 'LinkedIn Optimization', 'LinkedIn profile optimization tools and suggestions', false),
('github_profile', 'GitHub Profile', 'GitHub repository showcase and portfolio management', false),
('blog_posts', 'Blog Posts Management', 'Create, edit and publish blog posts', false),
('job_tracker', 'Job Tracker', 'Track job applications and manage application status', false),
('linkedin_network', 'LinkedIn Network', 'LinkedIn networking activities and growth tracking', false),
('enhancements', 'Profile Enhancements', 'Additional profile enhancement tools and features', false),
('network_connections', 'Network Connections', 'View and manage total LinkedIn connections', false),
('network_likes', 'Posts Liked', 'Track LinkedIn posts liked activity', false),
('network_comments', 'Comments Made', 'Track LinkedIn comments activity', false),
('network_posts', 'Posts Created', 'Track LinkedIn posts creation activity', false),
('network_weekly', 'Weekly Activity', 'View weekly LinkedIn activity summary', false),
('demo_resume_open', 'Demo Resume Track', 'Demo functionality for tracking resume opens', false),
('demo_job_search', 'Demo Job Search', 'Demo functionality for tracking job searches', false),
('demo_ai_query', 'Demo AI Query', 'Demo functionality for tracking AI queries', false);

-- Create function to update updated_at column
CREATE TRIGGER update_dashboard_click_permissions_updated_at
BEFORE UPDATE ON public.dashboard_click_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();