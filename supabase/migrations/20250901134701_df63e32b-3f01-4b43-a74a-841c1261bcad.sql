-- Fix all orphaned LinkedIn user tasks by updating them to reference auth_uid instead of linkedin_users.id

-- Drop the foreign key constraint temporarily  
ALTER TABLE linkedin_user_tasks DROP CONSTRAINT IF EXISTS linkedin_user_tasks_user_id_fkey;

-- Update all linkedin_user_tasks to use the correct user_id (auth_uid from linkedin_users)
UPDATE linkedin_user_tasks 
SET user_id = (
  SELECT lu.auth_uid 
  FROM linkedin_users lu 
  WHERE lu.id = linkedin_user_tasks.user_id
)
WHERE EXISTS (
  SELECT 1 FROM linkedin_users lu 
  WHERE lu.id = linkedin_user_tasks.user_id
);

-- Clean up any remaining orphaned tasks that don't have corresponding linkedin_users records
DELETE FROM linkedin_user_tasks 
WHERE user_id NOT IN (SELECT user_id FROM profiles);

-- Re-create the foreign key constraint to profiles table
ALTER TABLE linkedin_user_tasks 
ADD CONSTRAINT linkedin_user_tasks_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Verify the fix
SELECT lut.id, lut.user_id, lut.status, lt.title, p.username
FROM linkedin_user_tasks lut
JOIN linkedin_tasks lt ON lut.task_id = lt.id
JOIN profiles p ON lut.user_id = p.user_id
WHERE p.username = 'sushmaram'
ORDER BY lut.updated_at DESC;