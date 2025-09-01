-- First, let's check the current data
SELECT lut.id, lut.user_id, lut.status, lt.title, lu.auth_uid, lu.id as linkedin_user_id
FROM linkedin_user_tasks lut
JOIN linkedin_tasks lt ON lut.task_id = lt.id
JOIN linkedin_users lu ON lut.user_id = lu.id
WHERE lu.auth_uid = 'c3e464f8-840a-4129-8d83-45f4f3c1f186'
ORDER BY lut.updated_at DESC;

-- Now let's fix by updating the linkedin_user_tasks to reference the auth_uid instead of linkedin_users.id
-- But first drop the foreign key constraint temporarily
ALTER TABLE linkedin_user_tasks DROP CONSTRAINT IF EXISTS linkedin_user_tasks_user_id_fkey;

-- Update the user_id to point to auth_uid
UPDATE linkedin_user_tasks 
SET user_id = 'c3e464f8-840a-4129-8d83-45f4f3c1f186'
WHERE user_id = '4a62c5d6-46d3-43e0-acd2-5c0c31b1be61';

-- Re-create the foreign key constraint to profiles table (which should be the correct reference)
ALTER TABLE linkedin_user_tasks 
ADD CONSTRAINT linkedin_user_tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;