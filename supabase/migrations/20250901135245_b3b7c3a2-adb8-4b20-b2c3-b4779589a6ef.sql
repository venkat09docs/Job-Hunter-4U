-- Update RLS policies for linkedin_evidence to work with the new direct user relationship
-- Drop old policies that reference linkedin_users table
DROP POLICY IF EXISTS "Institute admins can view student LinkedIn evidence" ON linkedin_evidence;
DROP POLICY IF EXISTS "Users can view own evidence" ON linkedin_evidence;

-- Create new policies that work with direct user_id reference
CREATE POLICY "Institute admins can view student LinkedIn evidence" ON linkedin_evidence
FOR SELECT 
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM linkedin_user_tasks lut
    JOIN user_assignments ua ON (ua.user_id = lut.user_id)
    JOIN institute_admin_assignments iaa ON (ua.institute_id = iaa.institute_id)
    WHERE lut.id = linkedin_evidence.user_task_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);

-- Create new policy for users to view their own evidence
CREATE POLICY "Users can view own evidence" ON linkedin_evidence
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM linkedin_user_tasks lut
    WHERE lut.id = linkedin_evidence.user_task_id 
    AND lut.user_id = auth.uid()
  )
);