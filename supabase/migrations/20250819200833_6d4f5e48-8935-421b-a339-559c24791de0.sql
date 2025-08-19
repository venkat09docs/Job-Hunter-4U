-- Insert premium features configuration
INSERT INTO premium_features (feature_key, feature_name, description, is_premium) VALUES 
('career_assignments', 'Career Assignments', 'Complete tasks to build your professional profile', true),
('linkedin_growth_activities', 'LinkedIn Growth Activities', 'Complete weekly LinkedIn tasks to grow your professional network', true),
('job_hunting_assignments', 'Job Hunter – Assignments & Tracking', 'Weekly tasks, pipeline tracking, and progress verification', true),
('github_weekly', 'GitHub Weekly', 'Track your GitHub activity and showcase your repositories', true)
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  description = EXCLUDED.description,
  is_premium = EXCLUDED.is_premium;