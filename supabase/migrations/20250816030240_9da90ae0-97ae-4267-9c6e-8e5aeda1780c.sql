-- Fix the category names to match frontend expectations
UPDATE activity_point_settings 
SET category = 'linkedin'
WHERE category = 'LinkedIn Growth';

-- Update existing 'Posts Shared' to 'Create Post' with correct category
UPDATE activity_point_settings 
SET activity_name = 'Create Post',
    description = 'Create and publish original posts on LinkedIn',
    category = 'linkedin',
    updated_at = now()
WHERE activity_name = 'Posts Shared';

-- Delete any existing LinkedIn Growth activities that might have wrong category
DELETE FROM activity_point_settings 
WHERE category = 'LinkedIn Growth';

-- Add new LinkedIn Growth activities with correct category
INSERT INTO activity_point_settings (activity_type, activity_id, activity_name, points, description, category, is_active) VALUES
('linkedin_growth', 'share_content', 'Share Content', 5, 'Share relevant industry content and articles', 'linkedin', true),
('linkedin_growth', 'connection_requests', 'Connection Requests', 3, 'Send personalized connection requests to professionals', 'linkedin', true),
('linkedin_growth', 'follow_up_messages', 'Follow-Up Messages', 4, 'Send follow-up messages to recent connections', 'linkedin', true),
('linkedin_growth', 'profile_views', 'No of Profile Views', 2, 'Track the number of profile views received', 'linkedin', true),
('linkedin_growth', 'industry_research', 'Industry Research', 6, 'Research and engage with industry trends and insights', 'linkedin', true);