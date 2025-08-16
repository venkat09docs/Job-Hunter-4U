-- Update category from 'LinkedIn Growth' to 'linkedin' for the new activities
UPDATE activity_point_settings 
SET category = 'linkedin', updated_at = now()
WHERE category = 'LinkedIn Growth';

-- Rename 'Posts Shared' to 'Create Post'
UPDATE activity_point_settings 
SET activity_name = 'Create Post',
    description = 'Create and publish original posts on LinkedIn',
    updated_at = now()
WHERE activity_name = 'Posts Shared' AND category = 'linkedin';