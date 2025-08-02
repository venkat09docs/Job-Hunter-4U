-- Add page-level features to premium_features table
INSERT INTO public.premium_features (feature_key, feature_name, description, is_premium) VALUES 
('page_dashboard', 'Dashboard', 'Main dashboard with analytics and overview', false),
('page_resume_builder', 'Resume Builder', 'Build and customize professional resumes', false),
('page_job_search', 'Job Search', 'Search and find job opportunities', false),
('page_job_tracker', 'Job Tracker', 'Track job applications and their status', false),
('page_linkedin_optimization', 'LinkedIn Optimization', 'Optimize LinkedIn profile for better visibility', false),
('page_linkedin_network', 'LinkedIn Network', 'Manage and grow LinkedIn network connections', false),
('page_linkedin_automation', 'LinkedIn Automation', 'Automate LinkedIn activities and outreach', false),
('page_blog_dashboard', 'Blog Dashboard', 'Create and manage blog posts', false),
('page_talent_screener', 'Talent Screener', 'Screen and evaluate talent profiles', false),
('page_digital_career_hub', 'Digital Career Hub', 'Comprehensive career development tools', false),
('page_my_profile_journey', 'My Profile Journey', 'Track personal profile development progress', false),
('page_resources_library', 'Resources Library', 'Access to career development resources', false),
('page_manage_career_hub', 'Manage Career Hub', 'Administrative tools for career hub management', false),
('page_admin_dashboard', 'Admin Dashboard', 'Administrative dashboard for system management', false),
('page_user_management', 'User Management', 'Manage user accounts and permissions', false),
('page_manage_subscriptions', 'Manage Subscriptions', 'Manage subscription features and settings', false)
ON CONFLICT (feature_key) DO NOTHING;