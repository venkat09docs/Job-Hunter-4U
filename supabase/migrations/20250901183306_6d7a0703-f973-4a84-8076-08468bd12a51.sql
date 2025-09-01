-- Fix missing user roles for the verification functionality
-- Add recruiter role for test3@gmail.com user to test the verification page

INSERT INTO user_roles (user_id, role)
SELECT 
  p.user_id,
  'recruiter'::app_role
FROM profiles p 
WHERE p.email = 'test3@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = p.user_id
);