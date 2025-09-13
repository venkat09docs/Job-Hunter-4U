-- First, let's manually assign Test4 to RNS Tech Institute
INSERT INTO user_assignments (user_id, institute_id, batch_id, assignment_type, is_active) 
VALUES (
  'eaeb44be-1c35-4faa-80e2-10ae92f8c338', 
  '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80', 
  'acd2af9d-b906-4dc8-a250-fc5e47736e6a', 
  'admin_fix', 
  true
);

-- Update the institute student count
UPDATE institutes 
SET current_student_count = current_student_count + 1, 
    updated_at = now()
WHERE id = '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80';