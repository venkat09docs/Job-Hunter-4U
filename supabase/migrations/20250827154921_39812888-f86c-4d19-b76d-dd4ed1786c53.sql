-- Insert subcategories for job_hunter assignments
INSERT INTO public.sub_categories (name, description, parent_category, is_active) VALUES
('Application', 'Tasks related to job applications and application management', 'job_hunter', true),
('Networking', 'Tasks focused on building professional networks and connections', 'job_hunter', true),
('Follow-up', 'Activities for following up on applications and networking efforts', 'job_hunter', true),
('Research', 'Company research, role analysis, and market research tasks', 'job_hunter', true),
('Interview Preparation', 'Tasks to prepare for interviews and improve interview skills', 'job_hunter', true);