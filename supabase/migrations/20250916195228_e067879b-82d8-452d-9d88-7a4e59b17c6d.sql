-- Update RLS policy for clp_questions to allow viewing questions for assignment detail page
DROP POLICY IF EXISTS "Users can view questions during attempts" ON clp_questions;

-- Allow users to view questions if:
-- 1. They have any attempt for this assignment (to see overview and results)
-- 2. The assignment is published (to see basic question info before starting)
CREATE POLICY "Users can view questions for their assignments and published assignments" 
ON clp_questions 
FOR SELECT 
USING (
  -- Users can view questions if they have any attempt for this assignment
  (EXISTS (
    SELECT 1 FROM clp_attempts ca 
    WHERE ca.assignment_id = clp_questions.assignment_id 
    AND ca.user_id = auth.uid()
  ))
  OR 
  -- Or if the assignment is published (for preview/overview)
  (EXISTS (
    SELECT 1 FROM clp_assignments ca 
    WHERE ca.id = clp_questions.assignment_id 
    AND ca.is_published = true
  ))
);