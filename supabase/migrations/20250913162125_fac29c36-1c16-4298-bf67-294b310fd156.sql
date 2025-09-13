-- Update test4 and kent users from 'institute' assignment type to 'batch' assignment type
-- so they appear in Batch and Students Management views

UPDATE user_assignments 
SET assignment_type = 'batch'
WHERE user_id IN (
  SELECT user_id 
  FROM profiles 
  WHERE username IN ('test4', 'kent')
)
AND assignment_type = 'institute'
AND is_active = true;