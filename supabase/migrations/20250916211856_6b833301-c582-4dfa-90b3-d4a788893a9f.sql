-- Update RLS policy for clp_attempts to allow institute admins to update student attempts
DROP POLICY IF EXISTS "Users can manage their own attempts" ON clp_attempts;

-- Allow users to manage their own attempts
CREATE POLICY "Users can manage their own attempts" ON clp_attempts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow institute admins to update review status of student attempts in their institute
CREATE POLICY "Institute admins can update student attempt reviews" ON clp_attempts
FOR UPDATE
USING (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = clp_attempts.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
)
WITH CHECK (
  has_role(auth.uid(), 'institute_admin'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM user_assignments ua
    JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
    WHERE ua.user_id = clp_attempts.user_id 
    AND iaa.user_id = auth.uid() 
    AND ua.is_active = true 
    AND iaa.is_active = true
  )
);