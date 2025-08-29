-- Drop and recreate the existing policy to ensure proper access
DROP POLICY IF EXISTS "Institute admins can view assigned student profiles" ON public.profiles;

-- Ensure admins have proper access
CREATE POLICY "Admins and recruiters can view all profiles for verification" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  has_role(auth.uid(), 'recruiter'::app_role) 
  OR 
  (
    has_role(auth.uid(), 'institute_admin'::app_role) 
    AND EXISTS (
      SELECT 1
      FROM user_assignments ua
      JOIN institute_admin_assignments iaa ON ua.institute_id = iaa.institute_id
      WHERE ua.user_id = profiles.user_id 
      AND iaa.user_id = auth.uid() 
      AND ua.is_active = true 
      AND iaa.is_active = true
    )
  )
);