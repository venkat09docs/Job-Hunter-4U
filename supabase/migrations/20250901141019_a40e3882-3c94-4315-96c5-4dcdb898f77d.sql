-- Fix LinkedIn evidence INSERT policy to work with direct user_id references
DROP POLICY IF EXISTS "Users can insert own evidence" ON linkedin_evidence;

CREATE POLICY "Users can insert own evidence" 
ON linkedin_evidence 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM linkedin_user_tasks lut
    WHERE lut.id = linkedin_evidence.user_task_id 
    AND lut.user_id = auth.uid()
  )
);