-- Fix the assignment for Test4 with proper assigned_by field (using admin user ID)
INSERT INTO user_assignments (user_id, institute_id, batch_id, assignment_type, assigned_by, is_active) 
VALUES (
  'eaeb44be-1c35-4faa-80e2-10ae92f8c338', 
  '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80', 
  'acd2af9d-b906-4dc8-a250-fc5e47736e6a', 
  'admin_fix', 
  '2eb353a2-f3fd-4c88-b17f-6569e76d6154', 
  true
);

-- Update the institute student count
UPDATE institutes 
SET current_student_count = current_student_count + 1, 
    updated_at = now()
WHERE id = '8a75a3b2-9e8d-44ab-9f9a-a005fb822f80';