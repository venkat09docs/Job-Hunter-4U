-- Create a table to store activity point settings that includes total task counts
INSERT INTO activity_point_settings (activity_id, activity_name, category, points, description, is_active) 
VALUES 
  ('linkedin_total_tasks', 'LinkedIn Total Tasks', 'configuration', 9, 'Total number of LinkedIn profile completion tasks', true),
  ('github_total_tasks', 'GitHub Total Tasks', 'configuration', 8, 'Total number of GitHub profile completion tasks', true)
ON CONFLICT (activity_id) DO UPDATE SET 
  points = EXCLUDED.points,
  description = EXCLUDED.description,
  updated_at = now();