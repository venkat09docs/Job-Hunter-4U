-- Insert premium features for page access control
INSERT INTO premium_features (feature_key, feature_name, description, is_premium) VALUES
('build_my_profile', 'Build My Profile', 'Access to the comprehensive profile building and tracking dashboard', true),
('career_growth', 'Career Growth', 'Access to detailed career analytics, tracking, and insights', true),
('job_tracker', 'Job Tracker', 'Advanced job application tracking and management system', true),
('resume_builder', 'Resume Builder', 'Professional resume builder with AI assistance and multiple templates', true),
('linkedin_optimization', 'LinkedIn Optimization', 'LinkedIn profile optimization tools and recommendations', true),
('linkedin_automation', 'LinkedIn Automation', 'Automated LinkedIn job search and networking features', true),
('github_optimization', 'GitHub Optimization', 'GitHub profile and repository optimization tools', true),
('job_search', 'Job Search', 'Advanced job search and filtering capabilities', true)
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  description = EXCLUDED.description,
  is_premium = EXCLUDED.is_premium;