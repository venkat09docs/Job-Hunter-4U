-- Update existing user assignments to properly assign students to batches
-- First, let's update the assignment_type from 'institute' to 'batch' for students who already have batch_ids
UPDATE user_assignments 
SET assignment_type = 'batch', updated_at = now()
WHERE institute_id = '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80' 
  AND assignment_type = 'institute' 
  AND batch_id IS NOT NULL;

-- Distribute some students to the Non-IT batch for better batch performance comparison
-- Let's move 2 students (keerthi and Lalitha) to the Non-IT batch
UPDATE user_assignments 
SET batch_id = '37bb5110-42d7-43ea-8854-b2bfee404dd8', updated_at = now()
WHERE institute_id = '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80' 
  AND user_id IN (
    SELECT user_id FROM profiles 
    WHERE username IN ('keerthi', 'lalitha')
  );