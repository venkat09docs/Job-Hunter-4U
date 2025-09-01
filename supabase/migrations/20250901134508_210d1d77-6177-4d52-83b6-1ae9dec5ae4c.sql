-- Update LinkedIn user tasks to use the correct user_id (auth_uid from linkedin_users)
UPDATE linkedin_user_tasks 
SET user_id = (
  SELECT lu.auth_uid 
  FROM linkedin_users lu 
  WHERE lu.id = linkedin_user_tasks.user_id
)
WHERE user_id IN (
  SELECT id FROM linkedin_users 
  WHERE auth_uid = 'c3e464f8-840a-4129-8d83-45f4f3c1f186'
);

-- Verify the update worked
SELECT lut.id, lut.user_id, lut.status, lt.title, lut.updated_at 
FROM linkedin_user_tasks lut
JOIN linkedin_tasks lt ON lut.task_id = lt.id
WHERE lut.user_id = 'c3e464f8-840a-4129-8d83-45f4f3c1f186'
ORDER BY lut.updated_at DESC;