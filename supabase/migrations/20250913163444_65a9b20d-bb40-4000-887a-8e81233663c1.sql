-- Update hari user's assignment_type from 'institute' to 'batch'
UPDATE user_assignments 
SET assignment_type = 'batch'
WHERE user_id = (
    SELECT user_id 
    FROM profiles 
    WHERE username = 'hari' OR email = 'test10@gmail.com'
    LIMIT 1
) 
AND assignment_type = 'institute';