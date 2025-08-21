-- Add order field to assignment tables for display ordering
ALTER TABLE career_task_templates ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE linkedin_tasks ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE job_hunting_task_templates ADD COLUMN display_order INTEGER DEFAULT 0;
ALTER TABLE github_tasks ADD COLUMN display_order INTEGER DEFAULT 0;

-- Create index for better performance when ordering
CREATE INDEX idx_career_task_templates_display_order ON career_task_templates(display_order);
CREATE INDEX idx_linkedin_tasks_display_order ON linkedin_tasks(display_order);
CREATE INDEX idx_job_hunting_task_templates_display_order ON job_hunting_task_templates(display_order);
CREATE INDEX idx_github_tasks_display_order ON github_tasks(display_order);