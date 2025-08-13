-- Create activity_point_settings table for admin to configure points for each activity
CREATE TABLE public.activity_point_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  activity_name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT NOT NULL, -- 'resume', 'linkedin', 'github', 'job_application'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_type, activity_id)
);

-- Enable RLS
ALTER TABLE public.activity_point_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for activity_point_settings
CREATE POLICY "Super admins can manage activity point settings"
ON public.activity_point_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active point settings"
ON public.activity_point_settings
FOR SELECT
USING (is_active = true);

-- Create user_activity_points table to track user points
CREATE TABLE public.user_activity_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_type, activity_id, activity_date)
);

-- Enable RLS
ALTER TABLE public.user_activity_points ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activity_points
CREATE POLICY "Users can view their own activity points"
ON public.user_activity_points
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert user activity points"
ON public.user_activity_points
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update user activity points"
ON public.user_activity_points
FOR UPDATE
USING (true);

CREATE POLICY "Admins can view all activity points"
ON public.user_activity_points
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create leaderboard_rankings table for cached rankings
CREATE TABLE public.leaderboard_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL, -- 'current_week', 'last_week', 'last_30_days'
  total_points INTEGER NOT NULL DEFAULT 0,
  rank_position INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.leaderboard_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies for leaderboard_rankings
CREATE POLICY "Everyone can view leaderboard rankings"
ON public.leaderboard_rankings
FOR SELECT
USING (true);

CREATE POLICY "System can manage leaderboard rankings"
ON public.leaderboard_rankings
FOR ALL
USING (true);

-- Insert default activity point settings
INSERT INTO public.activity_point_settings (activity_type, activity_id, activity_name, points, description, category) VALUES
-- Resume/Profile activities
('resume_progress', 'personal_details_completed', 'Personal Details Completed', 10, 'Complete personal details section', 'resume'),
('resume_progress', 'experience_added', 'Experience Added', 15, 'Add work experience entry', 'resume'),
('resume_progress', 'education_added', 'Education Added', 10, 'Add education entry', 'resume'),
('resume_progress', 'skills_added', 'Skills Added', 5, 'Add skills to profile', 'resume'),
('resume_progress', 'professional_summary_completed', 'Professional Summary Completed', 20, 'Complete professional summary', 'resume'),
('resume_progress', 'resume_saved', 'Resume Saved', 25, 'Save a complete resume', 'resume'),

-- LinkedIn activities  
('linkedin_progress', 'profile_optimization_completed', 'LinkedIn Profile Optimization', 30, 'Complete LinkedIn profile optimization', 'linkedin'),
('linkedin_network', 'connections_made', 'New Connections', 2, 'Make new LinkedIn connections', 'linkedin'),
('linkedin_network', 'posts_shared', 'Posts Shared', 5, 'Share posts on LinkedIn', 'linkedin'),
('linkedin_network', 'comments_made', 'Comments Made', 3, 'Comment on LinkedIn posts', 'linkedin'),
('linkedin_network', 'likes_given', 'Likes Given', 1, 'Like LinkedIn posts', 'linkedin'),

-- GitHub activities
('github_progress', 'readme_generated', 'README Generated', 15, 'Generate GitHub README', 'github'),
('github_progress', 'special_repo_created', 'Special Repository Created', 20, 'Create special GitHub repository', 'github'),
('github_progress', 'readme_added', 'README Added to Repository', 10, 'Add README to repository', 'github'),
('github_progress', 'repo_public', 'Repository Made Public', 5, 'Make repository public', 'github'),

-- Job Application activities
('job_application', 'applications_sent', 'Job Applications Sent', 10, 'Send job applications', 'job_application'),
('job_application', 'interviews_scheduled', 'Interviews Scheduled', 25, 'Schedule job interviews', 'job_application'),
('job_application', 'follow_ups_sent', 'Follow-ups Sent', 5, 'Send follow-up messages', 'job_application'),
('job_application', 'networking_events', 'Networking Events Attended', 15, 'Attend networking events', 'job_application'),
('job_application', 'job_searches_performed', 'Job Searches Performed', 3, 'Perform job searches', 'job_application');

-- Create trigger to update updated_at column
CREATE TRIGGER update_activity_point_settings_updated_at
BEFORE UPDATE ON public.activity_point_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();