-- Update LinkedIn Growth activity IDs to match frontend
UPDATE activity_point_settings 
SET activity_id = 'comments'
WHERE activity_id = 'comments_made' AND category = 'linkedin';

UPDATE activity_point_settings 
SET activity_id = 'create_post'
WHERE activity_id = 'posts_shared' AND category = 'linkedin';

UPDATE activity_point_settings 
SET activity_id = 'follow_up'
WHERE activity_id = 'follow_up_messages' AND category = 'linkedin';

UPDATE activity_point_settings 
SET activity_id = 'post_likes'
WHERE activity_id = 'likes_given' AND category = 'linkedin';

UPDATE activity_point_settings 
SET activity_id = 'profile_optimization'
WHERE activity_id = 'profile_optimization_completed' AND category = 'linkedin';

UPDATE activity_point_settings 
SET activity_id = 'connections_accepted'
WHERE activity_id = 'connections_made' AND category = 'linkedin';

UPDATE activity_point_settings 
SET activity_id = 'content'
WHERE activity_id = 'share_content' AND category = 'linkedin';